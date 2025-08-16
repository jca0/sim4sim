"use client";

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Move, RotateCw, Scale } from 'lucide-react';
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
    { key: 'translate', label: 'Move', icon: Move },
    { key: 'rotate', label: 'Rotate', icon: RotateCw },
    { key: 'scale', label: 'Scale', icon: Scale }
  ] as const;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <ToggleGroup 
        type="single" 
        value={transformMode} 
        onValueChange={(value) => value && setTransformMode(value as TransformMode)}
        className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-lg"
      >
        {modes.map((mode) => {
          const IconComponent = mode.icon;
          return (
            <ToggleGroupItem
              key={mode.key}
              value={mode.key}
              aria-label={mode.label}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground cursor-pointer hover:scale-105 transition-transform"
            >
              <IconComponent className="h-4 w-4" />
              <span className="ml-2">{mode.label}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}
