"use client";

import { useRef } from 'react';
import { DoubleSide } from 'three';
import { OrbitControls, Grid } from '@react-three/drei';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import { useMeshRegistry } from '@/hooks/useMeshRegistry';
import { GeometryMesh } from './GeometryMesh';
import { TransformControlsComponent } from './TransformControlsComponent';
import type { TransformMode } from '@/hooks/useTransformMode';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';


interface SceneProps {
  transformMode: TransformMode;
}

export function Scene({ transformMode }: SceneProps) {
  const nodes = useMjcfEditorStore((state) => state.nodes);
  const orbitRef = useRef<OrbitControlsImpl | null>(null);
  
  const {
    selectedMesh,
    registerMesh,
    handleCanvasClick
  } = useMeshRegistry();

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
      
      {/* Ground grid */}
      <Grid 
        args={[20, 20]} 
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.6}
        cellColor={'#6b7280'}
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor={'#374151'}
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Render all geometry nodes */}
      {nodes.map((node) => (
        <GeometryMesh 
          key={node.id} 
          node={node} 
          registerMesh={registerMesh}
        />
      ))}

      {/* Ground plane for shadows */}
      <mesh 
        position={[0, -0.005, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleCanvasClick}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#f3f4f6" transparent opacity={0.6} side={DoubleSide} />
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
