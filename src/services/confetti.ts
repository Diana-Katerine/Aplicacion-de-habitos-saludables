export async function triggerCelebrationConfetti(options?: Record<string, any>) {
  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default;
    confetti(options);
  } catch {
    // Graceful fallback if canvas is not supported or script fails in intranet
  }
}
