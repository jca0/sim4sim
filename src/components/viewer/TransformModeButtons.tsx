"use client";

import type { TransformMode } from '@/hooks/useTransformMode';

interface TransformModeButtonsProps {
  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;
}

export function TransformModeButtons({ 
  transformMode, 
  setTransformMode 
}: TransformModeButtonsProps) {
  const modes = [
    { key: 'translate', label: 'Move', icon: '↔️' },
    { key: 'rotate', label: 'Rotate', icon: '🔄' },
    { key: 'scale', label: 'Scale', icon: '📏' }
  ] as const;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => setTransformMode(mode.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            transformMode === mode.key
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100 hover:scale-105 shadow-md'
          }`}
        >
          <span className="text-lg">{mode.icon}</span>
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
