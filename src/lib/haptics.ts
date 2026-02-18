/**
 * Lightweight haptic feedback for mobile PWA.
 * Uses navigator.vibrate() where available (Android).
 * iOS Safari does not support vibrate API, but the
 * CSS active:scale feedback provides visual confirmation.
 */

export function hapticLight() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

export function hapticMedium() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(20);
  }
}

export function hapticHeavy() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([30, 10, 30]);
  }
}
