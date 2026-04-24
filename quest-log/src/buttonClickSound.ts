/**
 * Button Click Sound — Utility module
 *
 * Plays 'ching_sound.mp3' for every <button> click in the application.
 *
 * Uses a single global event listener with event delegation,
 * so dynamically added buttons get the sound automatically.
 */

import chingSoundSrc from './ching_sound.mp3';

/**
 * Plays the ching sound.
 * Errors are caught silently so button interactions are never blocked.
 */
export function playClickSound(): void {
  try {
    const audio = new Audio(chingSoundSrc);
    audio.volume = 0.3; // Adjust volume as needed
    audio.play().catch(() => {});
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
 * Removes the global click listener.
 */
export function cleanupButtonClickSound(): void {
  document.removeEventListener('click', handleGlobalClick as EventListener);
}
