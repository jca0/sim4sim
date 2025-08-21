"use client";

import { useMemo, useState, useEffect } from "react";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Move, RotateCw, Shapes } from "lucide-react";

// Removed sliders; using numeric inputs only per request

// Convert quaternion [w, x, y, z] to Euler angles [x, y, z] in radians  
function quatToEuler(quat: [number, number, number, number]): [number, number, number] {
  // Validate and normalize quaternion to prevent NaN
  const safeQuat = quat.map(v => Number.isFinite(v) ? v : 0);
  const magnitude = Math.sqrt(safeQuat.reduce((sum, v) => sum + v * v, 0));
  const normalizedQuat = magnitude > 0 ? safeQuat.map(v => v / magnitude) : [1, 0, 0, 0];
  const [w, x, y, z] = normalizedQuat;
  
  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  // Pitch (y-axis rotation) - clamp to prevent NaN in sqrt
  const sinp_arg = Math.max(-1, Math.min(1, 1 + 2 * (w * y - x * z)));
  const cosp_arg = Math.max(-1, Math.min(1, 1 - 2 * (w * y - x * z)));
  const sinp = Math.sqrt(Math.max(0, sinp_arg));
  const cosp = Math.sqrt(Math.max(0, cosp_arg));
  const pitch = 2 * Math.atan2(sinp, cosp) - Math.PI / 2;

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return [
    Number.isFinite(roll) ? roll : 0,
    Number.isFinite(pitch) ? pitch : 0,
    Number.isFinite(yaw) ? yaw : 0
  ];
}

// Convert Euler angles [x, y, z] in radians to quaternion [w, x, y, z]
function eulerToQuat(euler: [number, number, number]): [number, number, number, number] {
  // Validate Euler angles to prevent NaN
  const safeEuler = euler.map(v => Number.isFinite(v) ? v : 0) as [number, number, number];
  const [roll, pitch, yaw] = safeEuler;
  
  const cr = Math.cos(roll * 0.5);
  const sr = Math.sin(roll * 0.5);
  const cp = Math.cos(pitch * 0.5);
  const sp = Math.sin(pitch * 0.5);
  const cy = Math.cos(yaw * 0.5);
  const sy = Math.sin(yaw * 0.5);

  const w = cr * cp * cy + sr * sp * sy;
  const x = sr * cp * cy - cr * sp * sy;
  const y = cr * sp * cy + sr * cp * sy;
  const z = cr * cp * sy - sr * sp * cy;

  return [
    Number.isFinite(w) ? w : 1,
    Number.isFinite(x) ? x : 0,
    Number.isFinite(y) ? y : 0,
    Number.isFinite(z) ? z : 0
  ];
}

function NumberInput({
  value,
  onCommit,
  step = 0.01,
  min,
  max,
  className,
}: {
  value: number;
  onCommit: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}) {
  const format = (n: number) => (Number.isFinite(n) ? String(n) : "0");
  const [text, setText] = useState<string>(format(value));
  useEffect(() => {
    setText(format(value));
  }, [value]);

  const commit = () => {
    const parsed = parseFloat(text);
    if (Number.isFinite(parsed)) {
      let v = parsed;
      if (typeof min === 'number') v = Math.max(min, v);
      if (typeof max === 'number') v = Math.min(max, v);
      onCommit(v);
      setText(format(v));
    } else {
      setText(format(value));
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
          setText(format(value));
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const parsed = parseFloat(text);
          const base = Number.isFinite(parsed) ? parsed : value;
          const next = base + step;
          let v = next;
          if (typeof min === 'number') v = Math.max(min, v);
          if (typeof max === 'number') v = Math.min(max, v);
          setText(format(v));
          onCommit(v);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const parsed = parseFloat(text);
          const base = Number.isFinite(parsed) ? parsed : value;
          const next = base - step;
          let v = next;
          if (typeof min === 'number') v = Math.max(min, v);
          if (typeof max === 'number') v = Math.min(max, v);
          setText(format(v));
          onCommit(v);
        }
      }}
      className={className}
    />
  );
}

export default function Inspector() {
  const nodes = useMjcfEditorStore((s) => s.nodes);
  const selection = useMjcfEditorStore((s) => s.selection);
  const updateTransform = useMjcfEditorStore((s) => s.updateTransform);
  // const rebuildXml = useMjcfEditorStore((s) => s.rebuildXml);
  const updateGeomSize = useMjcfEditorStore((s) => s.updateGeomSize);

  const node = useMemo(
    () => nodes.find((n) => n.id === selection) || null,
    [nodes, selection]
  );

  if (!node) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Inspector
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a body to edit its properties.
          </p>
        </CardContent>
      </Card>
    );
  }

  const setPos = (i: number, v: number) => {
    const pos = [...node.pos] as [number, number, number];
    pos[i] = v;
    updateTransform(node.id, pos, node.quat);
  };

  const setEuler = (i: number, v: number) => {
    const euler = quatToEuler(node.quat);
    euler[i] = v;
    const quat = eulerToQuat(euler);
    updateTransform(node.id, node.pos, quat);
  };
  
  const setSize = (i: number, v: number) => {
    updateGeomSize(node.id, i, v);
  };

  const sizeLabels =
    node.geom.type === "box"
      ? ["Width", "Height", "Depth"]
      : node.geom.type === "sphere"
      ? ["Radius"]
      : ["Radius", "Half Height"]; // capsule/cylinder

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm flex items-center">
          <Settings className="mr-2 h-4 w-4" />
          Inspector
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        {/* Body Info */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Body Name</Label>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {node.name}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Position */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center">
            <Move className="mr-2 h-4 w-4" />
            Position
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {["X", "Y", "Z"].map((axis, i) => (
              <div key={axis} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{axis}</Label>
                <NumberInput
                  value={Number.isFinite(node.pos[i]) ? node.pos[i] : 0}
                  onCommit={(v) => setPos(i, v)}
                  step={0.01}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rotation */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center">
            <RotateCw className="mr-2 h-4 w-4" />
            Rotation (degrees)
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {quatToEuler(node.quat).map((angle, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{['Roll','Pitch','Yaw'][i]}</Label>
                <NumberInput
                  value={Number.isFinite(angle) ? angle * (180 / Math.PI) : 0}
                  onCommit={(v) => setEuler(i, v * (Math.PI / 180))}
                  step={1}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Geometry */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium flex items-center">
              <Shapes className="mr-2 h-4 w-4" />
              Geometry
            </Label>
            <Badge variant="outline" className="capitalize">
              {node.geom.type}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sizeLabels.map((label, i) => (
              <div key={label} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <NumberInput
                  value={Number.isFinite(node.geom.size[i]) ? node.geom.size[i] : 0}
                  onCommit={(v) => setSize(i, v)}
                  step={0.01}
                  min={0}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Visual + physics flags */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center">Visual and Contact</Label>
          {/* RGBA on its own line */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Color (RGBA 0..1)</Label>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <NumberInput
                  key={i}
                  value={node.geom.rgba?.[i] ?? (i === 3 ? 1 : 0.5)}
                  onCommit={(val) => {
                    const arr = [...(node.geom.rgba ?? [0.5, 0.5, 0.5, 1])] as [number, number, number, number];
                    arr[i] = Math.min(1, Math.max(0, val));
                    const rgba = arr as [number, number, number, number];
                    const nodes = useMjcfEditorStore.getState().nodes.map(n => n.id === node.id ? { ...n, geom: { ...n.geom, rgba } } : n);
                    useMjcfEditorStore.setState({ nodes });
                    useMjcfEditorStore.getState().rebuildXml();
                  }}
                  step={0.01}
                  min={0}
                  max={1}
                />
              ))}
            </div>
          </div>

          {/* Other flags */}
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Group</Label>
              <NumberInput
                value={node.geom.group ?? 0}
                onCommit={(val) => {
                  val = Math.max(0, Math.floor(val));
                  const nodes = useMjcfEditorStore.getState().nodes.map(n => n.id === node.id ? { ...n, geom: { ...n.geom, group: val } } : n);
                  useMjcfEditorStore.setState({ nodes });
                  useMjcfEditorStore.getState().rebuildXml();
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Contype</Label>
              <NumberInput
                value={node.geom.contype ?? 0}
                onCommit={(val) => {
                  val = Math.max(0, Math.floor(val));
                  const nodes = useMjcfEditorStore.getState().nodes.map(n => n.id === node.id ? { ...n, geom: { ...n.geom, contype: val } } : n);
                  useMjcfEditorStore.setState({ nodes });
                  useMjcfEditorStore.getState().rebuildXml();
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Conaffinity</Label>
              <NumberInput
                value={node.geom.conaffinity ?? 0}
                onCommit={(val) => {
                  val = Math.max(0, Math.floor(val));
                  const nodes = useMjcfEditorStore.getState().nodes.map(n => n.id === node.id ? { ...n, geom: { ...n.geom, conaffinity: val } } : n);
                  useMjcfEditorStore.setState({ nodes });
                  useMjcfEditorStore.getState().rebuildXml();
                }}
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs text-muted-foreground">Friction (slide, spin, roll)</Label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <NumberInput
                    key={i}
                    value={node.geom.friction?.[i] ?? 0.5}
                    onCommit={(val) => {
                      const arr = [...(node.geom.friction ?? [0.5, 0.5, 0.5])] as [number, number, number];
                      arr[i] = Math.max(0, val);
                      const friction = arr as [number, number, number];
                      const nodes = useMjcfEditorStore.getState().nodes.map(n => n.id === node.id ? { ...n, geom: { ...n.geom, friction } } : n);
                      useMjcfEditorStore.setState({ nodes });
                      useMjcfEditorStore.getState().rebuildXml();
                    }}
                    step={0.01}
                    min={0}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


