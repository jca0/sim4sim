import { useState } from 'react';

export type TransformMode = 'translate' | 'rotate' | 'scale';

export function useTransformMode(initialMode: TransformMode = 'translate') {
  const [transformMode, setTransformMode] = useState<TransformMode>(initialMode);

  // Hotkeys removed per request

  return {
    transformMode,
    setTransformMode
  };
}
