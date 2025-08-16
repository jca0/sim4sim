"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls } from '@react-three/drei';
import { useMjcfEditorStore } from '@/contexts/MjcfEditorStore';
import type { BodyNode } from '@/types/mjcf';
import { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// Component to render a single geometry based on MJCF BodyNode
function GeometryMesh({ node, registerMesh }: { node: BodyNode; registerMesh: (nodeId: string, mesh: THREE.Mesh | null) => void }) {
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



// Transform controls component
function TransformControlsComponent({ 
  targetMesh, 
  orbitRef, 
  transformMode 
}: { 
  targetMesh: THREE.Mesh | null; 
  orbitRef: React.RefObject<any>;
  transformMode: 'translate' | 'rotate' | 'scale';
}) {
  const { selection, nodes, updateTransform, updateScale } = useMjcfEditorStore((state) => ({
    selection: state.selection,
    nodes: state.nodes,
    updateTransform: state.updateTransform,
    updateScale: state.updateScale
  }));
  const [initialScale, setInitialScale] = useState<THREE.Vector3 | null>(null);
  
  const selectedNode = nodes.find(node => node.id === selection);

  if (!selectedNode || !targetMesh) return null;

  return (
    <TransformControls
      object={targetMesh}
      mode={transformMode}
      onMouseDown={() => {
        if (orbitRef.current) orbitRef.current.enabled = false;
        
        // Store initial scale when starting to scale
        if (transformMode === 'scale' && targetMesh) {
          setInitialScale(targetMesh.scale.clone());
        }
      }}
      onObjectChange={() => {
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
      }}
      onMouseUp={() => {
        if (orbitRef.current) orbitRef.current.enabled = true;
        setInitialScale(null);
      }}
    />
  );
}

// Main scene component
function Scene({ transformMode }: { transformMode: 'translate' | 'rotate' | 'scale' }) {
  const nodes = useMjcfEditorStore((state) => state.nodes);
  const { select, selection } = useMjcfEditorStore((state) => ({ 
    select: state.select, 
    selection: state.selection 
  }));
  const orbitRef = useRef<any>(null);
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

  const handleCanvasClick = () => {
    select(null); // Deselect when clicking empty space
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Ground grid */}
      <Grid 
        args={[20, 20]} 
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.6}
        cellColor={'#6b7280'}
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor={'#374151'}
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Render all geometry nodes */}
      {nodes.map((node) => (
        <GeometryMesh 
          key={node.id} 
          node={node} 
          registerMesh={registerMesh}
        />
      ))}

      {/* Ground plane for shadows */}
      <mesh 
        position={[0, -0.005, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleCanvasClick}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#f3f4f6" transparent opacity={0.8} />
      </mesh>

      {/* Transform controls for selected object */}
      <TransformControlsComponent 
        targetMesh={selectedMesh} 
        orbitRef={orbitRef} 
        transformMode={transformMode}
      />

      {/* Controls */}
      <OrbitControls
        ref={orbitRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={50}
        target={[0, 1, 0]}
      />
    </>
  );
}

// Transform mode buttons component
function TransformModeButtons({ 
  transformMode, 
  setTransformMode 
}: { 
  transformMode: 'translate' | 'rotate' | 'scale';
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
}) {
  const modes = [
    { key: 'translate', label: 'Move', icon: '↔️' },
    { key: 'rotate', label: 'Rotate', icon: '🔄' },
    { key: 'scale', label: 'Scale', icon: '📏' }
  ] as const;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => setTransformMode(mode.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            transformMode === mode.key
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100 hover:scale-105 shadow-md'
          }`}
        >
          <span className="text-lg">{mode.icon}</span>
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function MujocoViewer() {
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

  // Keep keyboard shortcuts as optional secondary method
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch(event.key) {
        case 't':
          setTransformMode('translate');
          break;
        case 'r':
          setTransformMode('rotate');
          break;
        case 's':
          setTransformMode('scale');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Transform mode buttons */}
      <TransformModeButtons 
        transformMode={transformMode} 
        setTransformMode={setTransformMode} 
      />


      
      <Canvas
        shadows
        camera={{ 
          position: [5, 5, 5], 
          fov: 50,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
      >
        <Scene transformMode={transformMode} />
      </Canvas>
    </div>
  );
}
