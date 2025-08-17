"use client";

import { useRef, useEffect } from 'react';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import type { BodyNode } from '@/types/mjcf';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';

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
      try {
        registerMesh(node.id, meshRef.current);
      } catch (error) {
        console.warn('Error registering mesh for node:', node.id, error);
      }
    }
    
    // Cleanup on unmount
    return () => {
      registerMesh(node.id, null);
    };
  }, [node.id, registerMesh]);

  // Validate node before deriving geometry/props (hooks must run before early returns)
  if (!node || !node.geom || !node.pos || !node.quat || !node.geom.size) {
    console.warn('Invalid node data, skipping render:', node);
    return null;
  }
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
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
  
  // Create quaternion with additional validation
  const quaternion = new THREE.Quaternion(
    Number.isFinite(normalizedQuat[1]) ? normalizedQuat[1] : 0,
    Number.isFinite(normalizedQuat[2]) ? normalizedQuat[2] : 0, 
    Number.isFinite(normalizedQuat[3]) ? normalizedQuat[3] : 0,
    Number.isFinite(normalizedQuat[0]) ? normalizedQuat[0] : 1
  );
  
  // Ensure quaternion is normalized (Three.js requirement)
  if (!quaternion.length()) {
    quaternion.set(0, 0, 0, 1); // Identity quaternion
  } else {
    quaternion.normalize();
  }

  let geometry = null;
  const { type, size } = node.geom;
  
  // Validate and clean geometry size values
  const safeSize = size.map(v => Math.max(0.001, Number.isFinite(v) ? Math.abs(v) : 0.1));

  switch (type) {
    case 'sphere':
      const sphereRadius = Math.max(0.01, Math.min(10, safeSize[0] || 0.1));
      geometry = <sphereGeometry args={[sphereRadius, 16, 16]} />;
      break;
    case 'box':
      const boxX = Math.max(0.01, Math.min(10, safeSize[0] || 0.1)) * 2;
      const boxY = Math.max(0.01, Math.min(10, safeSize[1] || 0.1)) * 2;
      const boxZ = Math.max(0.01, Math.min(10, safeSize[2] || 0.1)) * 2;
      geometry = <boxGeometry args={[boxX, boxY, boxZ]} />;
      break;
    case 'capsule':
      const capsuleRadius = Math.max(0.01, Math.min(5, safeSize[0] || 0.05));
      const capsuleHeight = Math.max(0.02, Math.min(20, safeSize[1] || 0.2)) * 2;
      geometry = <capsuleGeometry args={[capsuleRadius, capsuleHeight, 8, 16]} />;
      break;
    case 'cylinder':
      const cylinderRadius = Math.max(0.01, Math.min(5, safeSize[0] || 0.05));
      const cylinderHeight = Math.max(0.02, Math.min(20, safeSize[1] || 0.2)) * 2;
      geometry = <cylinderGeometry args={[cylinderRadius, cylinderRadius, cylinderHeight, 16]} />;
      break;
    default:
      geometry = <boxGeometry args={[0.1, 0.1, 0.1]} />;
  }

  return (
    <mesh
      ref={meshRef}
      position={[
        Number.isFinite(safePosition[0]) ? safePosition[0] : 0,
        Number.isFinite(safePosition[1]) ? safePosition[1] : 0,
        Number.isFinite(safePosition[2]) ? safePosition[2] : 0
      ]}
      quaternion={[
        Number.isFinite(quaternion.x) ? quaternion.x : 0,
        Number.isFinite(quaternion.y) ? quaternion.y : 0,
        Number.isFinite(quaternion.z) ? quaternion.z : 0,
        Number.isFinite(quaternion.w) ? quaternion.w : 1
      ]}
      onClick={handleClick}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
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
            Math.max(0.01, (type === 'box' ? safeSize[0] * 2.1 : safeSize[0] * 2.1)),
            Math.max(0.01, (type === 'box' ? safeSize[1] * 2.1 : safeSize[0] * 2.1)),
            Math.max(0.01, (type === 'box' ? safeSize[2] * 2.1 : (safeSize[1] || safeSize[0]) * 2.1))
          ]} />
          <meshBasicMaterial color="#ff6b6b" wireframe opacity={0.5} transparent />
        </mesh>
      )}
    </mesh>
  );
}
