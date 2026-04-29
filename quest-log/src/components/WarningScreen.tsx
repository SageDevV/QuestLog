import { useEffect, useState } from 'react';
import warningSrc from '../warning.mp3';
import { bgSuspend, bgResume } from '../bgAudio';

// Preload the audio globally as soon as the module loads
const preloadedWarningAudio = new Audio(warningSrc);
preloadedWarningAudio.preload = 'auto';

// Call this during a user interaction (like login click) to unlock audio playback
export const unlockWarningAudio = () => {
  preloadedWarningAudio.play().then(() => {
    preloadedWarningAudio.pause();
    preloadedWarningAudio.currentTime = 0;
  }).catch(() => {});
};

export default function WarningScreen({ onClose }: { onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    bgSuspend();
    const audio = preloadedWarningAudio;
    audio.volume = 0.5;
    audio.currentTime = 0; // Reset in case it was played before
    
    // Play the audio and when it finishes, trigger the close animation
    audio.play().catch(() => {
      // If browser blocks autoplay, just fallback to visual timeout
      setTimeout(() => setIsClosing(true), 3600);
    });

    audio.onended = () => {
      setIsClosing(true);
    };

    return () => {
      audio.pause();
      bgResume();
    };
  }, []);

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(onClose, 400); // Wait for fade-out CSS
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  return (
    <div className={`warning-overlay ${isClosing ? 'closing' : ''}`} onClick={() => setIsClosing(true)}>
      <div className="warning-stripe top-stripe"></div>
      <div className="warning-center">
        <h1 className="warning-text">WARNING</h1>
      </div>
      <div className="warning-stripe bottom-stripe"></div>
    </div>
  );
}
