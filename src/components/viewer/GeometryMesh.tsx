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

  // Convert quaternion to Euler for rotation
  const quaternion = new THREE.Quaternion(node.quat[1], node.quat[2], node.quat[3], node.quat[0]);

  let geometry = null;
  const { type, size } = node.geom;

  switch (type) {
    case 'sphere':
      geometry = <sphereGeometry args={[size[0], 16, 16]} />;
      break;
    case 'box':
      geometry = <boxGeometry args={[size[0] * 2, size[1] * 2, size[2] * 2]} />;
      break;
    case 'capsule':
      // Approximate capsule as cylinder with spheres at ends
      geometry = <capsuleGeometry args={[size[0], size[1] * 2, 8, 16]} />;
      break;
    case 'cylinder':
      geometry = <cylinderGeometry args={[size[0], size[0], size[1] * 2, 16]} />;
      break;
    default:
      geometry = <boxGeometry args={[0.1, 0.1, 0.1]} />;
  }

  return (
    <mesh
      ref={meshRef}
      position={node.pos}
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
            type === 'box' ? size[0] * 2.1 : size[0] * 2.1,
            type === 'box' ? size[1] * 2.1 : size[0] * 2.1,
            type === 'box' ? size[2] * 2.1 : size[1] * 2.1
          ]} />
          <meshBasicMaterial color="#ff6b6b" wireframe opacity={0.5} transparent />
        </mesh>
      )}
    </mesh>
  );
}
