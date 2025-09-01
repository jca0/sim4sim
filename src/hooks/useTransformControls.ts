import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [lastReportedScale, setLastReportedScale] = useState<THREE.Vector3 | null>(null);
  const isShiftPressedRef = useRef(false);
  const isAltPressedRef = useRef(false);
  const draggingRef = useRef(false);
  const lastPointerYRef = useRef<number | null>(null);
  const pendingDeltaYRef = useRef<number>(0);

  // Track modifier keys for fine/fast scaling modes
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressedRef.current = true;
      if (e.key === 'Alt' || e.key === 'Option') isAltPressedRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressedRef.current = false;
      if (e.key === 'Alt' || e.key === 'Option') isAltPressedRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleMouseDown = useCallback((
    transformMode: TransformMode, 
    targetMesh: THREE.Mesh | null, 
    orbitRef: React.RefObject<OrbitControlsImpl | null>
  ) => {
    if (orbitRef.current) orbitRef.current.enabled = false;
    
    // Store initial scale when starting to scale
    if (transformMode === 'scale' && targetMesh) {
      setInitialScale(targetMesh.scale.clone());
      setLastReportedScale(new THREE.Vector3(1, 1, 1));
    }

    // Track pointer vertical movement while dragging for direct scale control
    draggingRef.current = true;
    lastPointerYRef.current = null;
    pendingDeltaYRef.current = 0;
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      if (lastPointerYRef.current == null) {
        lastPointerYRef.current = e.clientY;
      } else {
        const dy = e.clientY - (lastPointerYRef.current || e.clientY);
        pendingDeltaYRef.current += dy;
        lastPointerYRef.current = e.clientY;
      }
    };
    window.addEventListener('pointermove', onMove);
    // @ts-expect-error store for removal
    window.__tc_onMove = onMove;
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
        // Consume accumulated vertical delta (pixels); negative = cursor up => grow
        const dy = pendingDeltaYRef.current;
        if (dy !== 0) {
          pendingDeltaYRef.current = 0;
          // Per-pixel exponential response
          const baseK = 0.015;
          const fineK = 0.007;
          const fastK = 0.03;
          const k = isAltPressedRef.current ? fastK : isShiftPressedRef.current ? fineK : baseK;
          const s = Math.exp(-dy * k); // up (dy<0) => s>1, down (dy>0) => s<1
          const incremental = new THREE.Vector3(s, s, s);
          // Clamp per-tick
          const minStep = isShiftPressedRef.current ? 0.92 : 0.85;
          const maxStep = isAltPressedRef.current ? 3.0 : 2.2;
          incremental.x = Math.max(minStep, Math.min(maxStep, incremental.x));
          incremental.y = Math.max(minStep, Math.min(maxStep, incremental.y));
          incremental.z = Math.max(minStep, Math.min(maxStep, incremental.z));
          updateScale(selectedNode.id, [incremental.x, incremental.y, incremental.z]);
          // Restore baseline to avoid compounding visual gizmo scale
          targetMesh.scale.set(initialScale.x, initialScale.y, initialScale.z);
        }
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
  }, [selection, nodes, updateTransform, updateScale, initialScale, lastReportedScale]);

  const handleMouseUp = useCallback((orbitRef: React.RefObject<OrbitControlsImpl | null>) => {
    // Re-enable orbit controls and clear state
    if (orbitRef.current) orbitRef.current.enabled = true;
    setInitialScale(null);
    setLastReportedScale(null);
    draggingRef.current = false;
    // Remove move listener
    // @ts-expect-error stored earlier
    const onMove = window.__tc_onMove as ((e: PointerEvent) => void) | undefined;
    if (onMove) {
      window.removeEventListener('pointermove', onMove);
      // @ts-expect-error cleanup
      window.__tc_onMove = undefined;
    }
    lastPointerYRef.current = null;
    pendingDeltaYRef.current = 0;
  }, []);

  return {
    handleMouseDown,
    handleObjectChange,
    handleMouseUp
  };
}
