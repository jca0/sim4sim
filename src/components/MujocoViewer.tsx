"use client";

import { Canvas } from '@react-three/fiber';
import { useTransformMode } from '@/hooks/useTransformMode';
import { Scene } from '@/components/viewer/Scene';
import { TransformModeButtons } from '@/components/viewer/TransformModeButtons';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Circle, Square, Cylinder, Pill, Shapes } from 'lucide-react';
import * as THREE from 'three';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import { FiRotateCcw, FiRotateCw } from 'react-icons/fi';

export default function MujocoViewer() {
  const { transformMode, setTransformMode } = useTransformMode();
  const undo = useMjcfEditorStore((s) => s.undo);
  const redo = useMjcfEditorStore((s) => s.redo);
  const selection = useMjcfEditorStore((s) => s.selection);
  const addPrimitive = useMjcfEditorStore((s) => s.addPrimitive);

  return (
    <div className="w-full h-full relative">
      {/* Top-left circular undo/redo buttons */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <button
          aria-label="Undo"
          title="Undo (Ctrl/Cmd+Z)"
          onClick={undo}
          className="w-9 h-9 rounded-full bg-background/90 border shadow hover:bg-accent transition-colors flex items-center justify-center"
        >
          <FiRotateCcw className="w-4 h-4" />
        </button>
        <button
          aria-label="Redo"
          title="Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)"
          onClick={redo}
          className="w-9 h-9 rounded-full bg-background/90 border shadow hover:bg-accent transition-colors flex items-center justify-center"
        >
          <FiRotateCw className="w-4 h-4" />
        </button>
      </div>
      {/* Floating bottom toolbar (Figma-like) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-10 flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-full shadow-lg px-2 py-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 rounded-full cursor-pointer">
              <Shapes className="w-4 h-4 mr-2" />
              Primitives
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" sideOffset={6}>
            <DropdownMenuItem onClick={() => addPrimitive('sphere')} className="cursor-pointer"><Circle className="w-4 h-4 mr-2" />Sphere</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addPrimitive('box')} className="cursor-pointer"><Square className="w-4 h-4 mr-2" />Box</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addPrimitive('capsule')} className="cursor-pointer"><Pill className="w-4 h-4 mr-2" />Capsule</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addPrimitive('cylinder')} className="cursor-pointer"><Cylinder className="w-4 h-4 mr-2" />Cylinder</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="h-6 w-px bg-border mx-1" />
        <TransformModeButtons 
          transformMode={transformMode} 
          setTransformMode={setTransformMode} 
        />
      </div>

      <Canvas
        shadows
        camera={{ 
          position: [5, 5, 5], 
          fov: 50,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
      >
        <Scene transformMode={transformMode} />
      </Canvas>
    </div>
  );
}
