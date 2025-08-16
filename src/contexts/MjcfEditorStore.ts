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
    const nodes = get().nodes.map((n) => (n.id === id ? { ...n, pos, quat } : n));
    const xml = buildMjcfXml(nodes);
    set({ nodes, xml });
  },
  updateScale: (id, scale) => {
    const nodes = get().nodes.map((n) => {
      if (n.id !== id) return n;
      
      // Update geometry size based on scale and geometry type
      let newSize = [...n.geom.size];
      if (n.geom.type === 'sphere') {
        // sphere: [r] -> scale uniformly
        newSize[0] = newSize[0] * Math.max(scale[0], scale[1], scale[2]);
      } else if (n.geom.type === 'box') {
        // box: [sx, sy, sz] -> scale each dimension
        newSize[0] = newSize[0] * scale[0];
        newSize[1] = newSize[1] * scale[1]; 
        newSize[2] = newSize[2] * scale[2];
      } else if (n.geom.type === 'capsule' || n.geom.type === 'cylinder') {
        // capsule/cylinder: [r, halfheight] -> radius from x/z, height from y
        newSize[0] = newSize[0] * Math.max(scale[0], scale[2]);
        newSize[1] = newSize[1] * scale[1];
      }
      
      return { ...n, geom: { ...n.geom, size: newSize } };
    });
    const xml = buildMjcfXml(nodes);
    set({ nodes, xml });
  },
  select: (id) => set({ selection: id }),
  rebuildXml: () => set({ xml: buildMjcfXml(get().nodes) }),
  reset: () => set({ nodes: [], selection: null, xml: buildMjcfXml([]) }),
}));


