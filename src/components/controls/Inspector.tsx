"use client";

import { useMemo } from "react";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";

function NumberInput({
  value,
  onChange,
  step = 0.01,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full border rounded px-2 py-1 bg-transparent ${className}`}
    />
  );
}

export default function Inspector() {
  const nodes = useMjcfEditorStore((s) => s.nodes);
  const selection = useMjcfEditorStore((s) => s.selection);
  const updateTransform = useMjcfEditorStore((s) => s.updateTransform);
  const rebuildXml = useMjcfEditorStore((s) => s.rebuildXml);

  const node = useMemo(
    () => nodes.find((n) => n.id === selection) || null,
    [nodes, selection]
  );

  if (!node) {
    return (
      <div className="p-3 border-t">
        <div className="text-sm font-semibold opacity-70 mb-2">Inspector</div>
        <div className="text-xs opacity-60">Select a body to edit.</div>
      </div>
    );
  }

  const setPos = (i: number, v: number) => {
    const pos = [...node.pos] as [number, number, number];
    pos[i] = v;
    updateTransform(node.id, pos, node.quat);
  };
  const setQuat = (i: number, v: number) => {
    const quat = [...node.quat] as [number, number, number, number];
    quat[i] = v;
    updateTransform(node.id, node.pos, quat);
  };
  const setSize = (i: number, v: number) => {
    node.geom.size[i] = v;
    rebuildXml();
  };

  const sizeLabels =
    node.geom.type === "box"
      ? ["sx", "sy", "sz"]
      : node.geom.type === "sphere"
      ? ["r"]
      : ["r", "halfheight"]; // capsule/cylinder

  return (
    <div className="p-3 border-t space-y-3">
      <div className="text-sm font-semibold opacity-70">Inspector</div>

      <div>
        <div className="text-xs opacity-70 mb-1">Body name</div>
        <div className="text-xs font-mono">{node.name}</div>
      </div>

      <div>
        <div className="text-xs opacity-70 mb-1">Position (pos)</div>
        <div className="grid grid-cols-3 gap-2">
          <NumberInput value={node.pos[0]} onChange={(v) => setPos(0, v)} />
          <NumberInput value={node.pos[1]} onChange={(v) => setPos(1, v)} />
          <NumberInput value={node.pos[2]} onChange={(v) => setPos(2, v)} />
        </div>
      </div>

      <div>
        <div className="text-xs opacity-70 mb-1">Orientation (quat w x y z)</div>
        <div className="grid grid-cols-4 gap-2">
          <NumberInput value={node.quat[0]} onChange={(v) => setQuat(0, v)} />
          <NumberInput value={node.quat[1]} onChange={(v) => setQuat(1, v)} />
          <NumberInput value={node.quat[2]} onChange={(v) => setQuat(2, v)} />
          <NumberInput value={node.quat[3]} onChange={(v) => setQuat(3, v)} />
        </div>
      </div>

      <div>
        <div className="text-xs opacity-70 mb-1">Geom: {node.geom.type}</div>
        <div className={`grid gap-2 ${sizeLabels.length === 3 ? "grid-cols-3" : sizeLabels.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {sizeLabels.map((label, i) => (
            <div key={label} className="flex flex-col gap-1">
              <div className="text-[10px] uppercase opacity-60">{label}</div>
              <NumberInput
                value={node.geom.size[i] ?? 0}
                onChange={(v) => setSize(i, v)}
                step={0.01}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


