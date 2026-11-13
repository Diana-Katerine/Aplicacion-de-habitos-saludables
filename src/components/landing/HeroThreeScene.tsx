import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp, Layers } from 'lucide-react';

type SculpturePreset = 'morning' | 'deep' | 'exploded';

// Pre-allocated math helpers outside render loop (Zero GC)
const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scaleVec = new THREE.Vector3();
const _euler = new THREE.Euler();
const _color = new THREE.Color();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.06,
      size / 2,
      size / 2,
      size * 0.48
    );
    grad.addColorStop(0, 'rgba(23, 25, 28, 0.22)');
    grad.addColorStop(0.5, 'rgba(93, 42, 26, 0.09)');
    grad.addColorStop(1, 'rgba(250, 250, 251, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDialRingTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    ctx.fillStyle = '#f5f4f2';
    ctx.fillRect(0, 0, size, size);

    // Subtle concentric hairline rings
    ctx.strokeStyle = 'rgba(23, 25, 28, 0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(93, 42, 26, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
    ctx.stroke();

    // 30-day precision tick marks
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const isMajor = i % 2 === 0;
      const innerR = isMajor ? size * 0.385 : size * 0.41;
      const outerR = size * 0.442;
      ctx.strokeStyle = isMajor ? '#17191c' : 'rgba(119, 123, 134, 0.55)';
      ctx.lineWidth = isMajor ? 3.5 : 1.8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();
    }

    // Weekday cardinal inscriptions
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    ctx.fillStyle = '#5d2a1a';
    ctx.font = '500 26px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    labels.forEach((lbl, idx) => {
      const a = (idx / labels.length) * Math.PI * 2 - Math.PI / 2;
      const r = size * 0.305;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(lbl, 0, 0);
      ctx.restore();
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export const HeroThreeScene: React.FC = () => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [preset, setPreset] = useState<SculpturePreset>('morning');
  const [isPlaying, setIsPlaying] = useState(true);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const presetRef = useRef<SculpturePreset>('morning');
  const isPlayingRef = useRef<boolean>(true);
  const resetCameraFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 360);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const domCanvas = renderer.domElement;
    domCanvas.style.display = 'block';
    domCanvas.style.width = '100%';
    domCanvas.style.height = '100%';
    domCanvas.setAttribute('aria-label', 'Escultura cinética 3D interactiva de Impulso Diario');
    container.appendChild(domCanvas);

    // Scene & Editorial Warm-Paper Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#fafafb');
    scene.fog = new THREE.FogExp2('#fafafb', 0.036);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 60);
    const defaultCameraPos = new THREE.Vector3(0.35, 1.95, 6.55);
    const defaultTarget = new THREE.Vector3(0, 0.1, 0);
    camera.position.copy(defaultCameraPos);

    // Studio Environment Reflection (Mandatory for PBR realism)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Lighting Rig (<= 1 Shadow Caster)
    const hemiLight = new THREE.HemisphereLight(0xf6f8fc, 0xe8d5c9, 1.15);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4ea, 2.1);
    keyLight.position.set(4.8, 7.2, 5.2);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 22;
      keyLight.shadow.camera.left = -4.5;
      keyLight.shadow.camera.right = 4.5;
      keyLight.shadow.camera.top = 4.5;
      keyLight.shadow.camera.bottom = -4.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.85);
    rimLight.position.set(-5.5, 3.2, -4.5);
    scene.add(rimLight);

    // Controls
    const controls = new OrbitControls(camera, domCanvas);
    controls.target.copy(defaultTarget);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 4.6;
    controls.maxDistance = 10.5;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;

    let isUserInteracting = false;
    let cameraResetting = false;

    const handleControlStart = () => {
      isUserInteracting = true;
      cameraResetting = false;
    };
    const handleControlEnd = () => {
      isUserInteracting = false;
    };
    controls.addEventListener('start', handleControlStart);
    controls.addEventListener('end', handleControlEnd);

    resetCameraFnRef.current = () => {
      cameraResetting = true;
    };

    // Track disposable resources
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // PBR Materials in Steep Palette
    const alabasterMat = new THREE.MeshStandardMaterial({
      color: '#f2f2f3',
      roughness: 0.78,
      metalness: 0.04,
    });
    const inkSteelMat = new THREE.MeshPhysicalMaterial({
      color: '#17191c',
      roughness: 0.28,
      metalness: 0.88,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    });
    const siennaBronzeMat = new THREE.MeshPhysicalMaterial({
      color: '#733824',
      roughness: 0.22,
      metalness: 0.92,
      anisotropy: 0.7,
    });
    const blushCeramicMat = new THREE.MeshPhysicalMaterial({
      color: '#fbe1d1',
      roughness: 0.16,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const dialTex = createDialRingTexture(maxAniso);
    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTex,
      roughness: 0.52,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const shadowTex = createContactShadowTexture();
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });

    textures.push(dialTex, shadowTex);
    materials.push(
      alabasterMat,
      inkSteelMat,
      siennaBronzeMat,
      blushCeramicMat,
      dialMat,
      contactShadowMat
    );

    // ---------------------------------------------------------
    // Composite 9-Part Procedural Sculpture (`THREE.Group`)
    // ---------------------------------------------------------
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // Part 1: Grounded Contact Shadow Plane (y = -1.72)
    const shadowGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const shadowMesh = new THREE.Mesh(shadowGeo, contactShadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.72;
    heroGroup.add(shadowMesh);
    geometries.push(shadowGeo);

    // Part 2: Architectural Satin Alabaster Plinth (Bottom-centered flush)
    const plinthGroup = new THREE.Group();
    plinthGroup.position.y = -1.7;
    heroGroup.add(plinthGroup);

    const plinthBaseGeo = new THREE.CylinderGeometry(1.42, 1.56, 0.22, 64);
    const plinthBase = new THREE.Mesh(plinthBaseGeo, alabasterMat);
    plinthBase.position.y = 0.11;
    plinthBase.receiveShadow = !isSoftwareGl;
    plinthBase.castShadow = !isSoftwareGl;
    plinthGroup.add(plinthBase);
    geometries.push(plinthBaseGeo);

    // Part 3: Sienna Bronze Collar Ring atop Plinth
    const collarGeo = new THREE.TorusGeometry(1.42, 0.032, 20, 72);
    const collarMesh = new THREE.Mesh(collarGeo, siennaBronzeMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 0.22;
    plinthGroup.add(collarMesh);
    geometries.push(collarGeo);

    // Part 4: Calibrated 30-Day Dial Disc (Elevated above plinth)
    const dialGroup = new THREE.Group();
    dialGroup.position.y = -1.24;
    heroGroup.add(dialGroup);

    const dialDiscGeo = new THREE.CylinderGeometry(1.26, 1.26, 0.04, 64);
    const dialDiscMesh = new THREE.Mesh(dialDiscGeo, dialMat);
    dialDiscMesh.receiveShadow = !isSoftwareGl;
    dialDiscMesh.castShadow = !isSoftwareGl;
    dialGroup.add(dialDiscMesh);
    geometries.push(dialDiscGeo);

    // Part 5: LatheGeometry Central Vertical Axis Spindle
    const spindlePoints = [
      new THREE.Vector2(0.0, -0.35),
      new THREE.Vector2(0.16, -0.35),
      new THREE.Vector2(0.09, -0.18),
      new THREE.Vector2(0.045, 0.0),
      new THREE.Vector2(0.045, 1.35),
      new THREE.Vector2(0.11, 1.5),
      new THREE.Vector2(0.035, 1.66),
      new THREE.Vector2(0.0, 1.68),
    ];
    const spindleGeo = new THREE.LatheGeometry(spindlePoints, 40);
    const spindleMesh = new THREE.Mesh(spindleGeo, inkSteelMat);
    spindleMesh.position.y = -1.12;
    spindleMesh.castShadow = !isSoftwareGl;
    heroGroup.add(spindleMesh);
    geometries.push(spindleGeo);

    // Part 6: Central Blush Peach Ceramic Faceted Core + Ink Equator Band
    const coreGroup = new THREE.Group();
    coreGroup.position.y = 0.24;
    heroGroup.add(coreGroup);

    const coreGeo = new THREE.IcosahedronGeometry(0.56, 1);
    const coreMesh = new THREE.Mesh(coreGeo, blushCeramicMat);
    coreMesh.castShadow = !isSoftwareGl;
    coreGroup.add(coreMesh);
    geometries.push(coreGeo);

    const equatorGeo = new THREE.TorusGeometry(0.62, 0.036, 20, 64);
    const equatorMesh = new THREE.Mesh(equatorGeo, inkSteelMat);
    equatorMesh.rotation.x = Math.PI / 2;
    coreGroup.add(equatorMesh);
    geometries.push(equatorGeo);

    // Part 7: Three Concentric Gyroscopic Orbital Rings
    const ringOuterGroup = new THREE.Group();
    ringOuterGroup.position.y = 0.24;
    heroGroup.add(ringOuterGroup);

    const outerRingGeo = new THREE.TorusGeometry(1.78, 0.042, 24, 96);
    const outerRingMesh = new THREE.Mesh(outerRingGeo, inkSteelMat);
    outerRingMesh.castShadow = !isSoftwareGl;
    ringOuterGroup.add(outerRingMesh);
    geometries.push(outerRingGeo);

    const ringMidGroup = new THREE.Group();
    ringMidGroup.position.y = 0.24;
    heroGroup.add(ringMidGroup);

    const midRingGeo = new THREE.TorusGeometry(1.36, 0.036, 24, 84);
    const midRingMesh = new THREE.Mesh(midRingGeo, siennaBronzeMat);
    midRingMesh.castShadow = !isSoftwareGl;
    ringMidGroup.add(midRingMesh);
    geometries.push(midRingGeo);

    const ringInnerGroup = new THREE.Group();
    ringInnerGroup.position.y = 0.24;
    heroGroup.add(ringInnerGroup);

    const innerRingGeo = new THREE.TorusGeometry(0.98, 0.028, 20, 72);
    const innerRingMesh = new THREE.Mesh(innerRingGeo, alabasterMat);
    innerRingMesh.castShadow = !isSoftwareGl;
    ringInnerGroup.add(innerRingMesh);
    geometries.push(innerRingGeo);

    // Part 8: InstancedMesh — 30-Day Habit Momentum Nodes
    const nodeCount = 30;
    const nodeGeo = new THREE.SphereGeometry(0.082, 20, 16);
    const nodeMat = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.25,
      metalness: 0.15,
      clearcoat: 0.6,
    });
    const nodesInstanced = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
    nodesInstanced.castShadow = !isSoftwareGl;
    nodesInstanced.frustumCulled = false;

    const paletteHexes = ['#17191c', '#5d2a1a', '#9b5741', '#fbe1d1', '#d8d9dc'];
    const nodeBaseParams: { angle: number; radius: number; yOffset: number; scale: number }[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const t = i / nodeCount;
      const angle = t * Math.PI * 2;
      const radius = 1.78;
      const yOffset = Math.sin(angle * 2) * 0.18;
      const isPeakDay = i % 5 === 0 || i >= 24;
      const scale = isPeakDay ? 1.18 : 0.85;
      nodeBaseParams.push({ angle, radius, yOffset, scale });

      // Assign Steep tonal streak colors
      const colorHex =
        i >= 25
          ? paletteHexes[0]
          : i >= 18
          ? paletteHexes[1]
          : i >= 10
          ? paletteHexes[2]
          : i % 4 === 0
          ? paletteHexes[4]
          : paletteHexes[3];
      _color.set(colorHex);
      nodesInstanced.setColorAt(i, _color);
    }
    if (nodesInstanced.instanceColor) {
      nodesInstanced.instanceColor.needsUpdate = true;
    }

    const nodesOrbitGroup = new THREE.Group();
    nodesOrbitGroup.position.y = 0.24;
    nodesOrbitGroup.add(nodesInstanced);
    heroGroup.add(nodesOrbitGroup);
    geometries.push(nodeGeo);
    materials.push(nodeMat);

    // Part 9: 3 Orbital Kinetic Beads (attached to rings for tactile movement)
    const beadGeo = new THREE.SphereGeometry(0.11, 24, 18);
    const bead1 = new THREE.Mesh(beadGeo, siennaBronzeMat);
    bead1.position.set(1.78, 0, 0);
    ringOuterGroup.add(bead1);

    const bead2 = new THREE.Mesh(beadGeo, inkSteelMat);
    bead2.scale.setScalar(0.85);
    bead2.position.set(-1.36, 0, 0);
    ringMidGroup.add(bead2);

    const bead3 = new THREE.Mesh(beadGeo, blushCeramicMat);
    bead3.scale.setScalar(0.75);
    bead3.position.set(0, 0.98, 0);
    ringInnerGroup.add(bead3);
    geometries.push(beadGeo);

    // Pre-warm shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer Parallax Tracking
    let pointerX = 0;
    let pointerY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const rect = domCanvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    domCanvas.addEventListener('pointermove', handlePointerMove);

    // WebGL Context Loss Guard
    let contextLost = false;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const handleContextRestored = () => {
      contextLost = false;
    };
    domCanvas.addEventListener('webglcontextlost', handleContextLost);
    domCanvas.addEventListener('webglcontextrestored', handleContextRestored);

    // ResizeObserver for crisp responsive sizing
    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 280);
      const h = Math.max(container.clientHeight, 320);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Smooth Kinetic State
    const clock = new THREE.Clock();
    let simTime = 0;
    let explodeFactor = 0;
    let speedMultiplier = 1;
    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      try {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } catch {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (disposed) return;
      const rawDelta = Math.min(clock.getDelta(), 0.05);

      if (!contextLost) {
        const activePreset = presetRef.current;
        const targetExplode =
          activePreset === 'exploded' ? 1.0 : activePreset === 'deep' ? 0.28 : 0.0;
        const targetSpeed =
          !isPlayingRef.current
            ? 0.0
            : activePreset === 'deep'
            ? 0.42
            : activePreset === 'exploded'
            ? 0.65
            : 1.0;

        explodeFactor = THREE.MathUtils.damp(explodeFactor, targetExplode, 5.2, rawDelta);
        speedMultiplier = THREE.MathUtils.damp(speedMultiplier, targetSpeed, 5.2, rawDelta);
        simTime += rawDelta * speedMultiplier;

        // Smooth camera reset if requested
        if (cameraResetting) {
          camera.position.lerp(defaultCameraPos, 1 - Math.exp(-5 * rawDelta));
          controls.target.lerp(defaultTarget, 1 - Math.exp(-5 * rawDelta));
          if (camera.position.distanceTo(defaultCameraPos) < 0.02) {
            camera.position.copy(defaultCameraPos);
            controls.target.copy(defaultTarget);
            cameraResetting = false;
          }
        }

        // Gentle pointer tilt on heroGroup
        const targetRotY = isUserInteracting ? 0 : pointerX * 0.16;
        const targetRotX = isUserInteracting ? 0 : -pointerY * 0.08;
        heroGroup.rotation.y = THREE.MathUtils.damp(heroGroup.rotation.y, targetRotY, 4, rawDelta);
        heroGroup.rotation.x = THREE.MathUtils.damp(heroGroup.rotation.x, targetRotX, 4, rawDelta);

        // Exploded-view vertical offsets + breathing hover
        const breath = Math.sin(simTime * 1.4) * 0.045;
        dialGroup.position.y = -1.24 + explodeFactor * 0.26;
        coreGroup.position.y = 0.24 + breath + explodeFactor * 0.48;
        coreGroup.rotation.y = simTime * 0.45;
        coreGroup.rotation.z = Math.sin(simTime * 0.6) * 0.14;

        // Orbital ring precession
        ringOuterGroup.position.y = 0.24 + explodeFactor * 0.12;
        ringOuterGroup.rotation.x = 0.55 + Math.sin(simTime * 0.42) * 0.18;
        ringOuterGroup.rotation.y = simTime * 0.28;
        ringOuterGroup.rotation.z = 0.22 + explodeFactor * 0.18;

        ringMidGroup.position.y = 0.24 + explodeFactor * 0.34;
        ringMidGroup.rotation.x = -0.62 + Math.cos(simTime * 0.52) * 0.22;
        ringMidGroup.rotation.y = -simTime * 0.36;
        ringMidGroup.rotation.z = -0.35;

        ringInnerGroup.position.y = 0.24 + explodeFactor * 0.68;
        ringInnerGroup.rotation.x = 0.92 + Math.sin(simTime * 0.65) * 0.24;
        ringInnerGroup.rotation.y = simTime * 0.54;

        // Update 30-day InstancedMesh momentum crown
        nodesOrbitGroup.position.y = 0.24 + explodeFactor * 0.85;
        nodesOrbitGroup.rotation.y = simTime * 0.16;
        nodesOrbitGroup.rotation.x = 0.28 - explodeFactor * 0.22;

        for (let i = 0; i < nodeCount; i++) {
          const p = nodeBaseParams[i];
          const wave = Math.sin(simTime * 2.1 + p.angle * 3) * 0.08;
          const r = p.radius * (1 + explodeFactor * 0.22);
          _vec3.set(
            Math.cos(p.angle) * r,
            p.yOffset + wave + explodeFactor * Math.sin(p.angle) * 0.18,
            Math.sin(p.angle) * r
          );
          _euler.set(0, -p.angle, 0);
          _quat.setFromEuler(_euler);
          const s = p.scale * (0.94 + Math.sin(simTime * 2.4 + i) * 0.08);
          _scaleVec.set(s, s, s);
          _mat4.compose(_vec3, _quat, _scaleVec);
          nodesInstanced.setMatrixAt(i, _mat4);
        }
        nodesInstanced.instanceMatrix.needsUpdate = true;

        controls.update();
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      domCanvas.removeEventListener('pointermove', handlePointerMove);
      domCanvas.removeEventListener('webglcontextlost', handleContextLost);
      domCanvas.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.removeEventListener('start', handleControlStart);
      controls.removeEventListener('end', handleControlEnd);
      controls.dispose();

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envTarget.dispose();
      renderer.dispose();
      if (domCanvas.parentNode === container) {
        container.removeChild(domCanvas);
      }
    };
  }, []);

  if (webglUnavailable) {
    return (
      <div className="w-full h-full min-h-[420px] rounded-[24px] bg-[#fafafb] border border-[#ececec] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full border border-[#5d2a1a]/30 bg-[#fbe1d1] flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-[#5d2a1a]" />
        </div>
        <p className="font-signifier text-[24px] text-[#17191c]">
          Órbita de Constancia 3D
        </p>
        <p className="text-[14px] text-[#777b86] max-w-xs mt-1">
          Tu navegador actual no tiene aceleración WebGL activa. El resto de la experiencia funciona al 100%.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[420px] sm:h-[470px] lg:h-[510px] rounded-[24px] border border-[#ececec] bg-[#fafafb] overflow-hidden select-none">
      {/* Isolated WebGL Canvas Container */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion, No backdrop-filter) */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center max-w-[94%]">
        <button
          type="button"
          onClick={() => setHudCollapsed((c) => !c)}
          aria-label={hudCollapsed ? 'Mostrar controles 3D' : 'Ocultar controles 3D'}
          className="mb-1.5 px-3 py-1 rounded-full bg-white border border-[#ececec] text-[11px] text-[#777b86] hover:text-[#17191c] inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          {hudCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Controles 3D</span>
            </>
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        {!hudCollapsed && (
          <div className="px-2 py-1.5 rounded-full bg-white border border-[#ececec] shadow-sm flex flex-wrap items-center justify-center gap-1.5">
            {(
              [
                { id: 'morning', label: 'Ritmo' },
                { id: 'deep', label: 'Enfoque' },
                { id: 'exploded', label: 'Anatomía' },
              ] as { id: SculpturePreset; label: string }[]
            ).map((item) => {
              const active = preset === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item.id)}
                  className={`px-3 py-1 rounded-full text-[12px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#17191c] text-white'
                      : 'bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            <span aria-hidden="true" className="w-px h-4 bg-[#ececec] mx-0.5" />

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pausar animación 3D' : 'Reanudar animación 3D'}
              className="w-7 h-7 rounded-full bg-[#f2f2f3] hover:bg-[#17191c] text-[#17191c] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isPlaying ? 'Pausar animación' : 'Reanudar animación'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => resetCameraFnRef.current?.()}
              aria-label="Restablecer cámara 3D"
              className="w-7 h-7 rounded-full bg-[#f2f2f3] hover:bg-[#17191c] text-[#17191c] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Restablecer vista"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
