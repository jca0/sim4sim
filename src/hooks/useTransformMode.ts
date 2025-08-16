import { useState, useEffect } from 'react';

export type TransformMode = 'translate' | 'rotate' | 'scale';

export function useTransformMode(initialMode: TransformMode = 'translate') {
  const [transformMode, setTransformMode] = useState<TransformMode>(initialMode);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch(event.key) {
        case 't':
          setTransformMode('translate');
          break;
        case 'r':
          setTransformMode('rotate');
          break;
        case 's':
          setTransformMode('scale');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    transformMode,
    setTransformMode
  };
}
