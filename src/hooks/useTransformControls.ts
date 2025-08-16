import { useState, useCallback } from 'react';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import * as THREE from 'three';
import type { TransformMode } from './useTransformMode';

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
    orbitRef: React.RefObject<any>
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
        
        // Calculate delta scale with reduced sensitivity
        const sensitivity = 0.1; // Reduce sensitivity to 10%
        const deltaScale = new THREE.Vector3(
          1 + (currentScale.x - initialScale.x) * sensitivity,
          1 + (currentScale.y - initialScale.y) * sensitivity, 
          1 + (currentScale.z - initialScale.z) * sensitivity
        );
        
        // Clamp scale values to reasonable range
        deltaScale.x = Math.max(0.1, Math.min(3, deltaScale.x));
        deltaScale.y = Math.max(0.1, Math.min(3, deltaScale.y));
        deltaScale.z = Math.max(0.1, Math.min(3, deltaScale.z));
        
        updateScale(selectedNode.id, [deltaScale.x, deltaScale.y, deltaScale.z]);
        
        // Reset mesh scale to 1,1,1 since we've applied it to geometry
        targetMesh.scale.set(1, 1, 1);
        setInitialScale(new THREE.Vector3(1, 1, 1));
      }
    } else {
      // Handle translate/rotate modes - update transform
      const position = targetMesh.position;
      const quaternion = targetMesh.quaternion;
      
      updateTransform(
        selectedNode.id,
        [position.x, position.y, position.z],
        [quaternion.w, quaternion.x, quaternion.y, quaternion.z]
      );
    }
  }, [selection, nodes, updateTransform, updateScale, initialScale]);

  const handleMouseUp = useCallback((orbitRef: React.RefObject<any>) => {
    if (orbitRef.current) orbitRef.current.enabled = true;
    setInitialScale(null);
  }, []);

  return {
    handleMouseDown,
    handleObjectChange,
    handleMouseUp
  };
}
