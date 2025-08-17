import { useState, useCallback } from 'react';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import * as THREE from 'three';
import type { TransformMode } from './useTransformMode';
import type React from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export function useTransformControls() {
  const { selection, nodes, updateTransform, updateScale } = useMjcfEditorStore((state) => ({
    selection: state.selection,
    nodes: state.nodes,
    updateTransform: state.updateTransform,
    updateScale: state.updateScale
  }));
  
  const [initialScale, setInitialScale] = useState<THREE.Vector3 | null>(null);

  const handleMouseDown = useCallback((
    transformMode: TransformMode, 
    targetMesh: THREE.Mesh | null, 
    orbitRef: React.RefObject<OrbitControlsImpl | null>
  ) => {
    if (orbitRef.current) orbitRef.current.enabled = false;
    
    // Store initial scale when starting to scale
    if (transformMode === 'scale' && targetMesh) {
      setInitialScale(targetMesh.scale.clone());
    }
  }, []);

  const handleObjectChange = useCallback((
    transformMode: TransformMode,
    targetMesh: THREE.Mesh | null
  ) => {
    const selectedNode = nodes.find(node => node.id === selection);
    if (!selectedNode || !targetMesh) return;
    
    if (transformMode === 'scale') {
      // Handle scale mode - update geometry size
      if (initialScale) {
        const currentScale = targetMesh.scale;
        
        // Validate scale values to prevent NaN
        const safeCurrentScale = {
          x: Number.isFinite(currentScale.x) ? currentScale.x : 1,
          y: Number.isFinite(currentScale.y) ? currentScale.y : 1,
          z: Number.isFinite(currentScale.z) ? currentScale.z : 1
        };
        
        const safeInitialScale = {
          x: Number.isFinite(initialScale.x) ? initialScale.x : 1,
          y: Number.isFinite(initialScale.y) ? initialScale.y : 1,
          z: Number.isFinite(initialScale.z) ? initialScale.z : 1
        };
        
        // Calculate delta scale with reduced sensitivity
        const sensitivity = 0.1; // Reduce sensitivity to 10%
        const deltaScale = new THREE.Vector3(
          1 + (safeCurrentScale.x - safeInitialScale.x) * sensitivity,
          1 + (safeCurrentScale.y - safeInitialScale.y) * sensitivity, 
          1 + (safeCurrentScale.z - safeInitialScale.z) * sensitivity
        );
        
        // Clamp scale values to reasonable range and ensure finite
        deltaScale.x = Math.max(0.1, Math.min(3, Number.isFinite(deltaScale.x) ? deltaScale.x : 1));
        deltaScale.y = Math.max(0.1, Math.min(3, Number.isFinite(deltaScale.y) ? deltaScale.y : 1));
        deltaScale.z = Math.max(0.1, Math.min(3, Number.isFinite(deltaScale.z) ? deltaScale.z : 1));
        
        updateScale(selectedNode.id, [deltaScale.x, deltaScale.y, deltaScale.z]);
        
        // Reset mesh scale to 1,1,1 since we've applied it to geometry
        targetMesh.scale.set(1, 1, 1);
        setInitialScale(new THREE.Vector3(1, 1, 1));
      }
    } else {
      // Handle translate/rotate modes - update transform
      const position = targetMesh.position;
      const quaternion = targetMesh.quaternion;
      
      // Validate position values to prevent NaN
      const safePosition: [number, number, number] = [
        Number.isFinite(position.x) ? position.x : 0,
        Number.isFinite(position.y) ? position.y : 0,
        Number.isFinite(position.z) ? position.z : 0
      ];
      
      // Validate and normalize quaternion values to prevent NaN
      const rawQuat = [quaternion.w, quaternion.x, quaternion.y, quaternion.z];
      const safeQuat = rawQuat.map(v => Number.isFinite(v) ? v : 0);
      const quatMagnitude = Math.sqrt(safeQuat.reduce((sum, v) => sum + v * v, 0));
      const normalizedQuat: [number, number, number, number] = quatMagnitude > 0 
        ? safeQuat.map(v => v / quatMagnitude) as [number, number, number, number]
        : [1, 0, 0, 0]; // Identity quaternion if invalid
      
      updateTransform(selectedNode.id, safePosition, normalizedQuat);
    }
  }, [selection, nodes, updateTransform, updateScale, initialScale]);

  const handleMouseUp = useCallback((orbitRef: React.RefObject<OrbitControlsImpl | null>) => {
    // Re-enable orbit controls and clear state
    if (orbitRef.current) orbitRef.current.enabled = true;
    setInitialScale(null);
  }, []);

  return {
    handleMouseDown,
    handleObjectChange,
    handleMouseUp
  };
}
