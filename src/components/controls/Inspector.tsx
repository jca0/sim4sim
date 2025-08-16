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
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`w-full border rounded px-2 py-1 bg-transparent text-xs ${className}`}
    />
  );
}

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
    <div className="space-y-1">
      {label && <div className="text-[10px] uppercase opacity-60">{label}</div>}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <NumberInput
          value={value}
          onChange={onChange}
          step={step}
          className="w-16 text-center"
        />
      </div>
    </div>
  );
}

// Convert quaternion [w, x, y, z] to Euler angles [x, y, z] in radians  
function quatToEuler(quat: [number, number, number, number]): [number, number, number] {
  const [w, x, y, z] = quat;
  
  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  // Pitch (y-axis rotation)
  const sinp = Math.sqrt(1 + 2 * (w * y - x * z));
  const cosp = Math.sqrt(1 - 2 * (w * y - x * z));
  const pitch = 2 * Math.atan2(sinp, cosp) - Math.PI / 2;

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return [roll, pitch, yaw];
}

// Convert Euler angles [x, y, z] in radians to quaternion [w, x, y, z]
function eulerToQuat(euler: [number, number, number]): [number, number, number, number] {
  const [roll, pitch, yaw] = euler;
  
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

  return [w, x, y, z];
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
        <div className="text-xs opacity-70 mb-2">Transform Controls</div>
        <div className="text-xs opacity-50 mb-2">
          Use buttons above 3D view to switch between Move/Rotate/Scale modes
          <br />
          <span className="opacity-30">(T/R/S keys also work)</span>
        </div>
      </div>

      <div>
        <div className="text-xs opacity-70 mb-2">Position</div>
        <div className="space-y-2">
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

      <div>
        <div className="text-xs opacity-70 mb-2">Rotation (degrees)</div>
        <div className="space-y-2">
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

      <div>
        <div className="text-xs opacity-70 mb-2">Geometry: {node.geom.type}</div>
        <div className="space-y-2">
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
    </div>
  );
}


