"use client";

import { TransformControls } from '@react-three/drei';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import { useTransformControls } from '@/hooks/useTransformControls';
import type { TransformMode } from '@/hooks/useTransformMode';
import * as THREE from 'three';
import type React from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface TransformControlsComponentProps {
  targetMesh: THREE.Mesh | null;
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
  transformMode: TransformMode;
}

export function TransformControlsComponent({ 
  targetMesh, 
  orbitRef, 
  transformMode 
}: TransformControlsComponentProps) {
  const { selection, nodes } = useMjcfEditorStore((state) => ({
    selection: state.selection,
    nodes: state.nodes
  }));

  const {
    handleMouseDown,
    handleObjectChange,
    handleMouseUp
  } = useTransformControls();
  
  const selectedNode = nodes.find(node => node.id === selection);

  // Only render controls when the mesh exists and is attached to the scene graph
  if (!selectedNode || !targetMesh || !targetMesh.parent) return null;

  return (
    <TransformControls
      object={targetMesh}
      mode={transformMode}
      onMouseDown={() => handleMouseDown(transformMode, targetMesh, orbitRef)}
      onObjectChange={() => handleObjectChange(transformMode, targetMesh)}
      onMouseUp={() => handleMouseUp(orbitRef)}
    />
  );
}
