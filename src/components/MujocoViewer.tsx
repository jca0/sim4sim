"use client";

import { Canvas } from '@react-three/fiber';
import { useTransformMode } from '@/hooks/useTransformMode';
import { Scene } from '@/components/viewer/Scene';
import { TransformModeButtons } from '@/components/viewer/TransformModeButtons';
import * as THREE from 'three';

export default function MujocoViewer() {
  const { transformMode, setTransformMode } = useTransformMode();

  return (
    <div className="w-full h-full relative">
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
