import { useRef, useState, useEffect, useCallback } from 'react';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import * as THREE from 'three';

export function useMeshRegistry() {
  const { select, selection } = useMjcfEditorStore((state) => ({ 
    select: state.select, 
    selection: state.selection 
  }));
  
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const [selectedMesh, setSelectedMesh] = useState<THREE.Mesh | null>(null);

  // Update selected mesh when selection changes
  useEffect(() => {
    if (selection && meshRefs.current.has(selection)) {
      setSelectedMesh(meshRefs.current.get(selection) || null);
    } else {
      setSelectedMesh(null);
    }
  }, [selection]);

  // Register mesh reference - memoized to prevent re-renders
  const registerMesh = useCallback((nodeId: string, mesh: THREE.Mesh | null) => {
    if (mesh) {
      meshRefs.current.set(nodeId, mesh);
    } else {
      meshRefs.current.delete(nodeId);
    }
  }, []);

  const handleCanvasClick = useCallback(() => {
    select(null); // Deselect when clicking empty space
  }, [select]);

  return {
    selectedMesh,
    registerMesh,
    handleCanvasClick
  };
}
