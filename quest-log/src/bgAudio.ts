import musicSrc from './music_bg.mp3';

let audio: HTMLAudioElement | null = null;
let isEnabled = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(musicSrc);
    audio.loop = true;
    audio.volume = 0.3;
  }
  return audio;
}

export function bgPlay() {
  isEnabled = true;
  getAudio().play().catch(() => {});
}

export function bgPause() {
  isEnabled = false;
  audio?.pause();
}

export function bgSuspend() {
  audio?.pause();
}

export function bgResume() {
  if (isEnabled) {
    getAudio().play().catch(() => {});
  }
}

export function bgIsEnabled() {
  return isEnabled;
}
