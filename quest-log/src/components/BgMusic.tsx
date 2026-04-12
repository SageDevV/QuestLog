import { useState, useCallback } from 'react';
import { bgPlay, bgPause, bgIsEnabled } from '../bgAudio';

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
      className="music-toggle"
      onClick={toggle}
      title={playing ? 'Pausar música' : 'Tocar música'}
      aria-label={playing ? 'Pausar música de fundo' : 'Tocar música de fundo'}
    >
      {playing ? '🔊' : '🔇'}
    </button>
  );
}
