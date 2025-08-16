"use client";

import { useMemo } from "react";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Move, RotateCw, Ruler, Shapes } from "lucide-react";

function SliderWithInput({
  value,
  onChange,
  min = -10,
  max = 10,
  step = 0.01,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      <div className="flex items-center space-x-3">
        <Slider
          value={[Number.isFinite(value) ? value : 0]}
          onValueChange={([newValue]) => onChange(newValue)}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        <Input
          type="number"
          value={Number.isFinite(value) ? value.toFixed(2) : "0.00"}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          className="w-20 text-xs text-center cursor-text hover:border-primary/50 transition-colors"
        />
      </div>
    </div>
  );
}

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
    node.geom.size[i] = v;
    rebuildXml();
  };

  const sizeLabels =
    node.geom.type === "box"
      ? ["Width", "Height", "Depth"]
      : node.geom.type === "sphere"
      ? ["Radius"]
      : ["Radius", "Half Height"]; // capsule/cylinder

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <CardHeader className="pb-3 flex-shrink-0">
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
          <div className="space-y-3">
            <SliderWithInput 
              value={node.pos[0]} 
              onChange={(v) => setPos(0, v)} 
              min={-10} 
              max={10} 
              step={0.01}
              label="X"
            />
            <SliderWithInput 
              value={node.pos[1]} 
              onChange={(v) => setPos(1, v)} 
              min={-10} 
              max={10} 
              step={0.01}
              label="Y"
            />
            <SliderWithInput 
              value={node.pos[2]} 
              onChange={(v) => setPos(2, v)} 
              min={-10} 
              max={10} 
              step={0.01}
              label="Z"
            />
          </div>
        </div>

        <Separator />

        {/* Rotation */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center">
            <RotateCw className="mr-2 h-4 w-4" />
            Rotation (degrees)
          </Label>
          <div className="space-y-3">
            {quatToEuler(node.quat).map((angle, i) => (
              <SliderWithInput
                key={i}
                value={angle * (180 / Math.PI)} // Convert radians to degrees
                onChange={(v) => setEuler(i, v * (Math.PI / 180))} // Convert degrees to radians
                min={-180}
                max={180}
                step={1}
                label={['Roll', 'Pitch', 'Yaw'][i]}
              />
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
          <div className="space-y-3">
            {sizeLabels.map((label, i) => (
              <SliderWithInput
                key={label}
                value={node.geom.size[i] ?? 0}
                onChange={(v) => setSize(i, v)}
                min={0.01}
                max={2}
                step={0.01}
                label={label}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


