"use client";

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls, Grid } from '@react-three/drei';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import { useMeshRegistry } from '@/hooks/useMeshRegistry';
import { GeometryMesh } from './GeometryMesh';
import { TransformControlsComponent } from './TransformControlsComponent';
import type { TransformMode } from '@/hooks/useTransformMode';

interface SceneProps {
  transformMode: TransformMode;
}

export function Scene({ transformMode }: SceneProps) {
  const nodes = useMjcfEditorStore((state) => state.nodes);
  const orbitRef = useRef<any>(null);
  
  const {
    selectedMesh,
    registerMesh,
    handleCanvasClick
  } = useMeshRegistry();

  const checkerTexture = useMemo(() => {
    const size = 256;
    const tiles = 8; // number of squares per side
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const tileSize = size / tiles;
    const color1 = '#f3f4f6'; // light gray
    const color2 = '#e5e7eb'; // slightly darker gray
    for (let y = 0; y < tiles; y++) {
      for (let x = 0; x < tiles; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    // @ts-ignore - three types
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Ground plane (checkered, visible from below) */}

      {/* Render all geometry nodes */}
      {nodes.map((node) => (
        <GeometryMesh 
          key={node.id} 
          node={node} 
          registerMesh={registerMesh}
        />
      ))}

      <mesh 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleCanvasClick}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#ffffff" 
          map={checkerTexture as any}
          transparent 
          opacity={0.6} 
          side={THREE.DoubleSide}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Transform controls for selected object */}
      <TransformControlsComponent 
        targetMesh={selectedMesh} 
        orbitRef={orbitRef} 
        transformMode={transformMode}
      />

      {/* Controls */}
      <OrbitControls
        ref={orbitRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={50}
        target={[0, 1, 0]}
      />
    </>
  );
}
