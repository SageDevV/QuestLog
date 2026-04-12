/**
 * Button Click Sound — Utility module
 *
 * Synthesizes a short RPG-style click sound via Web Audio API
 * for every <button> click in the application.
 *
 * Uses a single global event listener with event delegation,
 * so dynamically added buttons get the sound automatically.
 */

let audioContext: AudioContext | null = null;

/**
 * Returns the shared AudioContext, creating it lazily on first call.
 * Errors are caught silently — returns null if creation fails.
 */
export function getOrCreateAudioContext(): AudioContext | null {
  if (audioContext) {
    return audioContext;
  }
  try {
    audioContext = new AudioContext();
    return audioContext;
  } catch {
    // Browser may not support Web Audio API
    return null;
  }
}

/**
 * Plays a short percussive click sound (~150ms, square wave, 800→400Hz).
 * Each call creates ephemeral OscillatorNode + GainNode that self-destruct
 * after playback, allowing natural overlap on rapid clicks.
 *
 * Errors are caught silently so button interactions are never blocked.
 */
export function playClickSound(): void {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    // Resume if suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // --- Oscillator: square wave, 800Hz → 400Hz sweep ---
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.15);

    // --- GainNode: percussive envelope, max 0.09 (below BgMusic's 0.15) ---
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.005); // fast attack ~5ms
    gain.gain.linearRampToValueAtTime(0, now + 0.15);     // decay to silence

    // Connect: osc → gain → destination
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Silently ignore any audio errors
  }
}

/**
 * Global click handler — delegates to playClickSound() when the
 * click target is (or is inside) a <button> element.
 */
export function handleGlobalClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (target?.closest?.('button')) {
    playClickSound();
  }
}

/**
 * Registers the global click listener on `document`.
 */
export function initButtonClickSound(): void {
  document.addEventListener('click', handleGlobalClick as EventListener);
}

/**
 * Removes the global click listener and closes the AudioContext.
 */
export function cleanupButtonClickSound(): void {
  document.removeEventListener('click', handleGlobalClick as EventListener);
  if (audioContext) {
    try {
      audioContext.close().catch(() => {});
    } catch {
      // ignore
    }
    audioContext = null;
  }
}
