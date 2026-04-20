import musicBgSrc from './music_bg.mp3';
import stageSelectSrc from './stage_select.mp3';
import volanicSrc from './volanic.mp3';

type TimeOfDay = 'morning' | 'afternoon' | 'night';

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'night';
}

/**
 * Track mapping by time of day:
 *  - morning (5h–12h):    stage_select
 *  - afternoon (12h–18h): volanic
 *  - night (18h–5h):      music_bg (default)
 */

const trackMap: Record<TimeOfDay, string[]> = {
  morning:   [stageSelectSrc],
  afternoon: [volanicSrc],
  night:     [musicBgSrc],
};

let audio: HTMLAudioElement | null = null;
let isEnabled = false;
let currentSrc = '';
let checkInterval: ReturnType<typeof setInterval> | null = null;

function pickTrack(time: TimeOfDay): string {
  const tracks = trackMap[time];
  if (tracks.length === 1) return tracks[0];
  // Random pick for night
  return tracks[Math.floor(Math.random() * tracks.length)];
}

function getOrCreateAudio(src: string): HTMLAudioElement {
  if (audio && currentSrc === src) return audio;

  // If source changed, stop the old one
  if (audio) {
    audio.pause();
    audio.src = '';
  }

  audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0.3;
  currentSrc = src;
  return audio;
}

function startCheckInterval() {
  if (checkInterval) return;
  checkInterval = setInterval(() => {
    if (!isEnabled) return;
    const time = getTimeOfDay();
    const neededTracks = trackMap[time];
    // If the current track doesn't belong to this time period, switch
    if (!neededTracks.includes(currentSrc)) {
      const newSrc = pickTrack(time);
      const a = getOrCreateAudio(newSrc);
      a.play().catch(() => {});
    }
  }, 60_000); // check every minute
}

export function bgPlay() {
  isEnabled = true;
  const time = getTimeOfDay();
  const src = pickTrack(time);
  const a = getOrCreateAudio(src);
  a.play().catch(() => {});
  startCheckInterval();
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
    // On resume, re-check the time — it may have changed
    const time = getTimeOfDay();
    const neededTracks = trackMap[time];
    if (!neededTracks.includes(currentSrc)) {
      const src = pickTrack(time);
      const a = getOrCreateAudio(src);
      a.play().catch(() => {});
    } else {
      audio?.play().catch(() => {});
    }
  }
}

export function bgIsEnabled() {
  return isEnabled;
}
