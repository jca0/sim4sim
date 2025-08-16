"use client";

import { create } from "zustand";
import type { BodyNode, GeomType } from "@/types/mjcf";
import { buildMjcfXml } from "@/lib/mjcf/xmlGen";

type EditorState = {
  nodes: BodyNode[];
  selection: string | null;
  xml: string;
  addPrimitive: (type: GeomType) => void;
  updateTransform: (
    id: string,
    pos: [number, number, number],
    quat: [number, number, number, number]
  ) => void;
  updateScale: (id: string, scale: [number, number, number]) => void;
  select: (id: string | null) => void;
  rebuildXml: () => void;
  reset: () => void;
};

let counter = 0;
const nextId = (prefix: string) => `${prefix}_${++counter}`;

export const useMjcfEditorStore = create<EditorState>((set, get) => ({
  nodes: [],
  selection: null,
  xml: buildMjcfXml([]),
  addPrimitive: (type) => {
    const id = nextId("body");
    const name = id;
    const defaultByType: Record<GeomType, number[]> = {
      sphere: [0.1],
      box: [0.1, 0.1, 0.1],
      capsule: [0.05, 0.2],
      cylinder: [0.05, 0.2],
    };
    const node: BodyNode = {
      id,
      name,
      pos: [0, 0, 0],
      quat: [1, 0, 0, 0],
      geom: { type, size: defaultByType[type] },
    };
    const nodes = [...get().nodes, node];
    const xml = buildMjcfXml(nodes);
    set({ nodes, selection: id, xml });
  },
  updateTransform: (id, pos, quat) => {
    // Validate position values
    const safePos: [number, number, number] = [
      Number.isFinite(pos[0]) ? pos[0] : 0,
      Number.isFinite(pos[1]) ? pos[1] : 0,
      Number.isFinite(pos[2]) ? pos[2] : 0
    ];
    
    // Validate and normalize quaternion
    const safeQuat = quat.map(q => Number.isFinite(q) ? q : 0);
    const quatMagnitude = Math.sqrt(safeQuat.reduce((sum, q) => sum + q * q, 0));
    const normalizedQuat: [number, number, number, number] = quatMagnitude > 0
      ? safeQuat.map(q => q / quatMagnitude) as [number, number, number, number]
      : [1, 0, 0, 0]; // Identity quaternion if invalid
    
    const nodes = get().nodes.map((n) => (n.id === id ? { ...n, pos: safePos, quat: normalizedQuat } : n));
    const xml = buildMjcfXml(nodes);
    set({ nodes, xml });
  },
  updateScale: (id, scale) => {
    const nodes = get().nodes.map((n) => {
      if (n.id !== id) return n;
      
      // Validate scale values to prevent NaN propagation
      const safeScale = scale.map(s => Number.isFinite(s) ? Math.max(0.001, s) : 1);
      
      // Update geometry size based on scale and geometry type
      let newSize = [...n.geom.size];
      if (n.geom.type === 'sphere') {
        // sphere: [r] -> scale uniformly
        const uniformScale = Math.max(safeScale[0], safeScale[1], safeScale[2]);
        newSize[0] = Math.max(0.001, (n.geom.size[0] || 0.1) * uniformScale);
      } else if (n.geom.type === 'box') {
        // box: [sx, sy, sz] -> scale each dimension
        newSize[0] = Math.max(0.001, (n.geom.size[0] || 0.1) * safeScale[0]);
        newSize[1] = Math.max(0.001, (n.geom.size[1] || 0.1) * safeScale[1]); 
        newSize[2] = Math.max(0.001, (n.geom.size[2] || 0.1) * safeScale[2]);
      } else if (n.geom.type === 'capsule' || n.geom.type === 'cylinder') {
        // capsule/cylinder: [r, halfheight] -> radius from x/z, height from y
        const radialScale = Math.max(safeScale[0], safeScale[2]);
        newSize[0] = Math.max(0.001, (n.geom.size[0] || 0.05) * radialScale);
        newSize[1] = Math.max(0.001, (n.geom.size[1] || 0.2) * safeScale[1]);
      }
      
      // Ensure all new size values are finite
      newSize = newSize.map(s => Number.isFinite(s) ? s : 0.1);
      
      return { ...n, geom: { ...n.geom, size: newSize } };
    });
    const xml = buildMjcfXml(nodes);
    set({ nodes, xml });
  },
  select: (id) => set({ selection: id }),
  rebuildXml: () => set({ xml: buildMjcfXml(get().nodes) }),
  reset: () => set({ nodes: [], selection: null, xml: buildMjcfXml([]) }),
}));


