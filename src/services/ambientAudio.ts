export type SoundscapePreset = 'rain' | 'drone' | 'breeze';

export interface SoundscapeOption {
  id: SoundscapePreset;
  label: string;
  description: string;
}

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  {
    id: 'rain',
    label: 'Lluvia suave',
    description: 'Ruido rosa filtrado con oleaje lento y cálido',
  },
  {
    id: 'drone',
    label: 'Resonancia profunda',
    description: 'Armónicos graves suaves en quinta abierta',
  },
  {
    id: 'breeze',
    label: 'Brisa & notas',
    description: 'Viento tenue con destellos armónicos generativos',
  },
];

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private chimeTimer: number | null = null;
  private isPlaying = false;
  private currentPreset: SoundscapePreset = 'rain';
  private volume = 0.35;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private clearActiveNodes() {
    if (this.chimeTimer !== null) {
      window.clearInterval(this.chimeTimer);
      this.chimeTimer = null;
    }

    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
      } catch {
        // Node may already be stopped
      }
      try {
        node.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    });
    this.activeNodes = [];
  }

  private createPinkNoiseBuffer(ctx: AudioContext, durationSeconds = 6): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const output = buffer.getChannelData(channel);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  private buildRainGraph(ctx: AudioContext, destination: AudioNode) {
    const buffer = this.createPinkNoiseBuffer(ctx, 8);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 720;
    lowpass.Q.value = 0.5;

    const warmth = ctx.createBiquadFilter();
    warmth.type = 'lowshelf';
    warmth.frequency.value = 180;
    warmth.gain.value = 3;

    // Gentle LFO modulating filter cutoff for organic rain swells
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 180;
    lfo.connect(lfoDepth);
    lfoDepth.connect(lowpass.frequency);

    const layerGain = ctx.createGain();
    layerGain.gain.value = 0.95;

    noise.connect(lowpass);
    lowpass.connect(warmth);
    warmth.connect(layerGain);
    layerGain.connect(destination);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, lowpass, warmth, lfo, lfoDepth, layerGain);
  }

  private buildDroneGraph(ctx: AudioContext, destination: AudioNode) {
    // Open Dsus2 warm pad frequencies (D2, A2, E3, A3)
    const freqs = [73.42, 110.0, 164.81, 220.0];
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 360;
    filter.Q.value = 0.8;

    const padGain = ctx.createGain();
    padGain.gain.value = 0.36;

    filter.connect(padGain);
    padGain.connect(destination);
    this.activeNodes.push(filter, padGain);

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (idx - 1.5) * 4;

      const voiceGain = ctx.createGain();
      voiceGain.gain.value = idx === 0 ? 0.38 : idx === 1 ? 0.28 : 0.16;

      // Subtle slow breathing per harmonic
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.04 + idx * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.06;
      lfo.connect(lfoGain);
      lfoGain.connect(voiceGain.gain);

      osc.connect(voiceGain);
      voiceGain.connect(filter);

      osc.start();
      lfo.start();
      this.activeNodes.push(osc, voiceGain, lfo, lfoGain);
    });
  }

  private buildBreezeGraph(ctx: AudioContext, destination: AudioNode) {
    const buffer = this.createPinkNoiseBuffer(ctx, 8);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 320;
    bandpass.Q.value = 0.9;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.06;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 140;
    lfo.connect(lfoDepth);
    lfoDepth.connect(bandpass.frequency);

    const windGain = ctx.createGain();
    windGain.gain.value = 0.7;

    noise.connect(bandpass);
    bandpass.connect(windGain);
    windGain.connect(destination);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, bandpass, lfo, lfoDepth, windGain);

    // Generative pentatonic soft harmonic notes every few seconds
    const scale = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33]; // D4, E4, G4, A4, C5, D5
    const triggerNote = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const freq = scale[Math.floor(Math.random() * scale.length)];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.08, now + 0.18);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(noteGain);
      noteGain.connect(destination);
      osc.start(now);
      osc.stop(now + 4.0);
    };

    triggerNote();
    this.chimeTimer = window.setInterval(() => {
      if (Math.random() < 0.72) {
        triggerNote();
      }
    }, 3400);
  }

  public start(preset: SoundscapePreset = this.currentPreset, volume = this.volume): boolean {
    const ctx = this.ensureContext();
    if (!ctx) return false;

    this.currentPreset = preset;
    this.volume = Math.max(0, Math.min(1, volume));
    this.clearActiveNodes();

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(ctx.destination);
    }

    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.7);

    this.isPlaying = true;
    if (preset === 'rain') {
      this.buildRainGraph(ctx, this.masterGain);
    } else if (preset === 'drone') {
      this.buildDroneGraph(ctx, this.masterGain);
    } else {
      this.buildBreezeGraph(ctx, this.masterGain);
    }

    return true;
  }

  public setPreset(preset: SoundscapePreset) {
    this.currentPreset = preset;
    if (this.isPlaying) {
      this.start(preset, this.volume);
    }
  }

  public setVolume(nextVolume: number) {
    this.volume = Math.max(0, Math.min(1, nextVolume));
    if (this.ctx && this.masterGain && this.isPlaying) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.volume, now, 0.08);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.12);
    }
    window.setTimeout(() => {
      if (!this.isPlaying) {
        this.clearActiveNodes();
      }
    }, 280);
  }
}

export const ambientAudio = new AmbientAudioEngine();
