import { useState } from 'react';

export type TransformMode = 'translate' | 'rotate' | 'scale';

export function useTransformMode(initialMode: TransformMode = 'translate') {
  const [transformMode, setTransformMode] = useState<TransformMode>(initialMode);

  // Hotkeys (1=Move, 2=Rotate, 3=Scale) like common DCC tools
  // Also support W/E/R
  if (typeof window !== 'undefined') {
    // attach once per hook instance
    // Note: simple listener; consumer unmounts when viewer unmounts
    window.onkeydown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName.match(/input|textarea/i)) return;
      const key = e.key.toLowerCase();
      if (key === '1' || key === 'w') setTransformMode('translate');
      if (key === '2' || key === 'e') setTransformMode('rotate');
      if (key === '3' || key === 'r') setTransformMode('scale');
    };
  }

  return {
    transformMode,
    setTransformMode
  };
}
