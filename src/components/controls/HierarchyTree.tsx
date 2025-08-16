"use client";

import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";

export default function HierarchyTree() {
  const nodes = useMjcfEditorStore((s) => s.nodes);
  const selection = useMjcfEditorStore((s) => s.selection);
  const select = useMjcfEditorStore((s) => s.select);

  return (
    <div className="p-3 overflow-auto h-full">
      <div className="text-sm font-semibold opacity-70 mb-2">Hierarchy</div>
      <ul className="space-y-1">
        {nodes.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => select(n.id)}
              className={`w-full text-left px-2 py-1 rounded ${
                selection === n.id
                  ? "bg-black/10 dark:bg-white/15"
                  : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <span className="opacity-60 mr-2">body</span>
              <span className="font-mono text-xs">{n.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


