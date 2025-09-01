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
      className="p-0 gap-1"
    >
      {modes.map((mode) => {
        const IconComponent = mode.icon;
        return (
          <ToggleGroupItem
            key={mode.key}
            value={mode.key}
            aria-label={mode.label}
            title={mode.label}
            className="h-8 w-8 p-0 cursor-pointer transition-colors rounded-md border border-transparent data-[state=on]:bg-[var(--vscode-list-activeSelectionBackground,#094771)] data-[state=on]:text-[var(--vscode-list-activeSelectionForeground,#ffffff)] hover:bg-[var(--vscode-toolbar-hoverBackground,#2a2d2e)] hover:text-[var(--vscode-foreground,#d4d4d4)] flex items-center justify-center"
          >
            <IconComponent className="h-4 w-4" />
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
