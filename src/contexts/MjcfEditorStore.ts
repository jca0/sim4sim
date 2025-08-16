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
  select: (id) => set({ selection: id }),
  rebuildXml: () => set({ xml: buildMjcfXml(get().nodes) }),
  reset: () => set({ nodes: [], selection: null, xml: buildMjcfXml([]) }),
}));


