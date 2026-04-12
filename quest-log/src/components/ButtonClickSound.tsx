import { useEffect } from 'react';
import { initButtonClickSound, cleanupButtonClickSound } from '../buttonClickSound';

/**
 * Renderless component that registers/unregisters the global
 * button click sound listener via React lifecycle.
 */
export default function ButtonClickSound(): null {
  useEffect(() => {
    initButtonClickSound();
    return () => {
      cleanupButtonClickSound();
    };
  }, []);

  return null;
}
