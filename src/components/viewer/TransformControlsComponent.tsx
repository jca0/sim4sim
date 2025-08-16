"use client";

import { TransformControls } from '@react-three/drei';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import { useTransformControls } from '@/hooks/useTransformControls';
import type { TransformMode } from '@/hooks/useTransformMode';
import * as THREE from 'three';

interface TransformControlsComponentProps {
  targetMesh: THREE.Mesh | null;
  orbitRef: React.RefObject<any>;
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

  if (!selectedNode || !targetMesh) return null;

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
