"use client";

import { Canvas } from '@react-three/fiber';
import { useTransformMode } from '@/hooks/useTransformMode';
import { Scene } from '@/components/viewer/Scene';
import { TransformModeButtons } from '@/components/viewer/TransformModeButtons';
import * as THREE from 'three';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import { FiRotateCcw, FiRotateCw } from 'react-icons/fi';

export default function MujocoViewer() {
  const { transformMode, setTransformMode } = useTransformMode();
  const undo = useMjcfEditorStore((s) => s.undo);
  const redo = useMjcfEditorStore((s) => s.redo);

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
      {/* Transform mode buttons */}
      <TransformModeButtons 
        transformMode={transformMode} 
        setTransformMode={setTransformMode} 
      />

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
