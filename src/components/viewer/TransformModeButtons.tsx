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
    <ToggleGroup 
      type="single" 
      value={transformMode} 
      onValueChange={(value) => value && setTransformMode(value as TransformMode)}
      className="rounded-full p-1 gap-2"
    >
      {modes.map((mode) => {
        const IconComponent = mode.icon;
        return (
          <ToggleGroupItem
            key={mode.key}
            value={mode.key}
            aria-label={mode.label}
            className="rounded-full px-3 py-1.5 cursor-pointer transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <IconComponent className="h-4 w-4" />
            <span className="ml-2">{mode.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
