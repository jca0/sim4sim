"use client";

import { useRef, useEffect } from 'react';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import type { BodyNode } from '@/types/mjcf';
import * as THREE from 'three';

interface GeometryMeshProps {
  node: BodyNode;
  registerMesh: (nodeId: string, mesh: THREE.Mesh | null) => void;
}

export function GeometryMesh({ node, registerMesh }: GeometryMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { selection, select } = useMjcfEditorStore((state) => ({
    selection: state.selection,
    select: state.select
  }));

  const isSelected = selection === node.id;

  // Register mesh reference when component mounts/updates
  useEffect(() => {
    if (meshRef.current) {
      registerMesh(node.id, meshRef.current);
    }
    
    // Cleanup on unmount
    return () => {
      registerMesh(node.id, null);
    };
  }, [node.id, registerMesh]);
  
  const handleClick = (e: any) => {
    e.stopPropagation();
    select(node.id);
  };

  // Validate and clean position values
  const safePosition = node.pos.map(v => Number.isFinite(v) ? v : 0) as [number, number, number];
  
  // Validate and clean quaternion values
  const safeQuat = node.quat.map(v => Number.isFinite(v) ? v : 0);
  // Ensure quaternion is normalized - if all zeros, use identity quaternion
  const quatMagnitude = Math.sqrt(safeQuat.reduce((sum, v) => sum + v * v, 0));
  const normalizedQuat = quatMagnitude > 0 ? safeQuat.map(v => v / quatMagnitude) : [1, 0, 0, 0];
  const quaternion = new THREE.Quaternion(normalizedQuat[1], normalizedQuat[2], normalizedQuat[3], normalizedQuat[0]);

  let geometry = null;
  const { type, size } = node.geom;
  
  // Validate and clean geometry size values
  const safeSize = size.map(v => Math.max(0.001, Number.isFinite(v) ? Math.abs(v) : 0.1));

  switch (type) {
    case 'sphere':
      geometry = <sphereGeometry args={[safeSize[0], 16, 16]} />;
      break;
    case 'box':
      geometry = <boxGeometry args={[safeSize[0] * 2, safeSize[1] * 2, safeSize[2] * 2]} />;
      break;
    case 'capsule':
      // Approximate capsule as cylinder with spheres at ends
      geometry = <capsuleGeometry args={[safeSize[0], safeSize[1] * 2, 8, 16]} />;
      break;
    case 'cylinder':
      geometry = <cylinderGeometry args={[safeSize[0], safeSize[0], safeSize[1] * 2, 16]} />;
      break;
    default:
      geometry = <boxGeometry args={[0.1, 0.1, 0.1]} />;
  }

  return (
    <mesh
      ref={meshRef}
      position={safePosition}
      quaternion={quaternion}
      onClick={handleClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      {geometry}
      <meshStandardMaterial
        color={node.geom.rgba ? `rgb(${node.geom.rgba[0] * 255}, ${node.geom.rgba[1] * 255}, ${node.geom.rgba[2] * 255})` : '#69b7ff'}
        opacity={node.geom.rgba?.[3] ?? 1}
        transparent={node.geom.rgba?.[3] !== undefined && node.geom.rgba[3] < 1}
        wireframe={isSelected}
      />
      {isSelected && (
        <mesh>
          <boxGeometry args={[
            type === 'box' ? safeSize[0] * 2.1 : safeSize[0] * 2.1,
            type === 'box' ? safeSize[1] * 2.1 : safeSize[0] * 2.1,
            type === 'box' ? safeSize[2] * 2.1 : safeSize[1] * 2.1
          ]} />
          <meshBasicMaterial color="#ff6b6b" wireframe opacity={0.5} transparent />
        </mesh>
      )}
    </mesh>
  );
}
