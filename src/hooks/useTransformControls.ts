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

        // Compute scale factor relative to initial drag start
        const rawFactor = new THREE.Vector3(
          safeCurrentScale.x / (safeInitialScale.x || 1),
          safeCurrentScale.y / (safeInitialScale.y || 1),
          safeCurrentScale.z / (safeInitialScale.z || 1)
        );

        // Sensitivity with modifiers
        // Base: responsive; Shift = fine; Alt/Option = fast
        const baseSensitivity = 0.38;
        const fineSensitivity = 0.16;
        const fastSensitivity = 0.6;
        const sensitivity = isAltPressedRef.current
          ? fastSensitivity
          : isShiftPressedRef.current
          ? fineSensitivity
          : baseSensitivity;
        const overallFactor = new THREE.Vector3(
          1 + (rawFactor.x - 1) * sensitivity,
          1 + (rawFactor.y - 1) * sensitivity,
          1 + (rawFactor.z - 1) * sensitivity
        );

        // Compute incremental factor since last report to avoid compounding
        const last = lastReportedScale ?? new THREE.Vector3(1, 1, 1);
        const incremental = new THREE.Vector3(
          (Number.isFinite(overallFactor.x) ? overallFactor.x : 1) / (last.x || 1),
          (Number.isFinite(overallFactor.y) ? overallFactor.y : 1) / (last.y || 1),
          (Number.isFinite(overallFactor.z) ? overallFactor.z : 1) / (last.z || 1)
        );

        // If user drags inward past baseline, allow shrink by inverting step (<1)
        // Ensure symmetrical behavior for <1 factors
        incremental.x = Number.isFinite(incremental.x) ? incremental.x : 1;
        incremental.y = Number.isFinite(incremental.y) ? incremental.y : 1;
        incremental.z = Number.isFinite(incremental.z) ? incremental.z : 1;

        // Clamp per-tick change to keep it smooth (tighter for fine, larger for fast)
        const minStep = isShiftPressedRef.current ? 0.9 : 0.8;
        const maxStep = isAltPressedRef.current ? 3.0 : 2.2;
        incremental.x = Math.max(minStep, Math.min(maxStep, incremental.x));
        incremental.y = Math.max(minStep, Math.min(maxStep, incremental.y));
        incremental.z = Math.max(minStep, Math.min(maxStep, incremental.z));

        updateScale(selectedNode.id, [incremental.x, incremental.y, incremental.z]);

        // Keep gizmo stable by restoring baseline and remember last overall factor
        targetMesh.scale.set(safeInitialScale.x, safeInitialScale.y, safeInitialScale.z);
        setLastReportedScale(overallFactor);
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
  }, []);

  return {
    handleMouseDown,
    handleObjectChange,
    handleMouseUp
  };
}
