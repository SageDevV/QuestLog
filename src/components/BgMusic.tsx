import { useState, useCallback } from 'react';
import { bgPlay, bgPause } from '../bgAudio';

export default function BgMusic() {
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback(() => {
    if (playing) {
      bgPause();
      setPlaying(false);
    } else {
      bgPlay();
      setPlaying(true);
    }
  }, [playing]);

  return (
    <button
      className={`music-toggle ${playing ? 'is-playing' : ''}`}
      onClick={toggle}
      title={playing ? 'Pausar música' : 'Tocar música'}
      aria-label={playing ? 'Pausar música de fundo' : 'Tocar música de fundo'}
      aria-pressed={playing}
    >
      <span className="music-toggle-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10v4h4l5 4V6L8 10H4Z" />
          {playing ? <><path d="M16 9.5a4 4 0 0 1 0 5" /><path d="M18.8 7a7.5 7.5 0 0 1 0 10" /></> : <path d="m17 9-6 6M11 9l6 6" />}
        </svg>
      </span>
      <span className="music-toggle-label">ÁUDIO</span>
      <span className="music-signal" aria-hidden="true"><i /><i /><i /></span>
    </button>
  );
}
