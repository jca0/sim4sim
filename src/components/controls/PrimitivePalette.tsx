"use client";

import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";

const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full text-left border rounded px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
  >
    {children}
  </button>
);

export default function PrimitivePalette() {
  const addPrimitive = useMjcfEditorStore((s) => s.addPrimitive);
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="text-sm font-semibold opacity-70">Add primitives</div>
      <Button onClick={() => addPrimitive("sphere")}>Sphere</Button>
      <Button onClick={() => addPrimitive("box")}>Box</Button>
      <Button onClick={() => addPrimitive("capsule")}>Capsule</Button>
      <Button onClick={() => addPrimitive("cylinder")}>Cylinder</Button>
    </div>
  );
}


