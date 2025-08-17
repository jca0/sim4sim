"use client";

import { create } from "zustand";
import type { BodyNode, GeomType } from "@/types/mjcf";
import { buildMjcfXml } from "@/lib/mjcf/xmlGen";
import { parseMjcfXml } from "@/lib/mjcf/xmlParse";

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
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  renameSelected: (newName: string) => void;
  setXml: (xml: string) => void;
};

let counter = 0;
const nextId = (prefix: string) => `${prefix}_${++counter}`;

export const useMjcfEditorStore = create<EditorState>((set, get) => ({
  nodes: [],
  selection: null,
  xml: buildMjcfXml([]),
  // Internal undo/redo stacks kept in closure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...((): any => {
    type Snapshot = { nodes: BodyNode[]; selection: string | null; xml: string };
    const undoStack: Snapshot[] = [];
    const redoStack: Snapshot[] = [];

    const takeSnapshot = (): Snapshot => {
      const { nodes, selection, xml } = get();
      return {
        nodes: JSON.parse(JSON.stringify(nodes)) as BodyNode[],
        selection,
        xml,
      };
    };

    const pushUndo = () => {
      undoStack.push(takeSnapshot());
      if (undoStack.length > 100) undoStack.shift();
      // Clear redo stack on new user action (branching)
      redoStack.length = 0;
    };

    const applySnapshot = (snap: Snapshot) => {
      set({ nodes: snap.nodes, selection: snap.selection, xml: snap.xml });
    };

    return {
      __undoStack: undoStack,
      __redoStack: redoStack,
      __pushUndo: pushUndo,
      __takeSnapshot: takeSnapshot,
      __applySnapshot: applySnapshot,
    };
  })(),
  addPrimitive: (type) => {
    // @ts-expect-error internal helper in closure
    get().__pushUndo();
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
  renameSelected: (newName: string) => {
    const sel = get().selection;
    if (!sel) return;
    // @ts-expect-error internal helper in closure
    get().__pushUndo();
    const nodes = get().nodes.map((n) =>
      n.id === sel ? { ...n, name: newName } : n
    );
    const xml = buildMjcfXml(nodes);
    set({ nodes, xml });
  },
  updateTransform: (id, pos, quat) => {
    // @ts-expect-error internal helper in closure
    get().__pushUndo();
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
    // @ts-expect-error internal helper in closure
    get().__pushUndo();
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
  reset: () => {
    // @ts-expect-error internal helper in closure
    get().__pushUndo();
    set({ nodes: [], selection: null, xml: buildMjcfXml([]) });
  },
  deleteSelected: () => {
    const selectedId = get().selection;
    if (!selectedId) return;
    // @ts-expect-error internal helper in closure
    get().__pushUndo();
    const nodes = get().nodes.filter((n) => n.id !== selectedId);
    const xml = buildMjcfXml(nodes);
    set({ nodes, selection: null, xml });
  },
  undo: () => {
    // @ts-expect-error internal stacks in closure
    const undoStack = get().__undoStack as Array<{ nodes: BodyNode[]; selection: string | null; xml: string }>;
    // @ts-expect-error internal stacks in closure
    const redoStack = get().__redoStack as Array<{ nodes: BodyNode[]; selection: string | null; xml: string }>;
    if (!undoStack.length) return;
    const current = get().__takeSnapshot();
    const prev = undoStack.pop();
    if (!prev) return;
    redoStack.push(current);
    if (redoStack.length > 100) redoStack.shift();
    // @ts-expect-error internal helper in closure
    get().__applySnapshot(prev);
  },
  redo: () => {
    // @ts-expect-error internal stacks in closure
    const undoStack = get().__undoStack as Array<{ nodes: BodyNode[]; selection: string | null; xml: string }>;
    // @ts-expect-error internal stacks in closure
    const redoStack = get().__redoStack as Array<{ nodes: BodyNode[]; selection: string | null; xml: string }>;
    if (!redoStack.length) return;
    const current = get().__takeSnapshot();
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(current);
    if (undoStack.length > 100) undoStack.shift();
    // @ts-expect-error internal helper in closure
    get().__applySnapshot(next);
  },
  setXml: (xmlString: string) => {
    // Try parse; if fails, do not change state
    try {
      // @ts-expect-error internal helper in closure
      get().__pushUndo();
      const nodes = parseMjcfXml(xmlString);
      const xml = buildMjcfXml(nodes);
      set({ nodes, xml, selection: null });
    } catch (e) {
      // ignore parse errors to avoid locking UI while typing
    }
  },
}));


