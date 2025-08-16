"use client";
import PrimitivePalette from "@/components/controls/PrimitivePalette";
import HierarchyTree from "@/components/controls/HierarchyTree";
import XmlPreview from "@/components/controls/XmlPreview";
import Inspector from "@/components/controls/Inspector";
import MujocoViewer from "@/components/MujocoViewer";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";



export default function EditorPage() {
  return (
    <div className="grid grid-cols-[260px_1fr_420px] grid-rows-[auto_1fr] h-screen">
      <header className="col-span-3 border-b px-4 py-2 flex items-center gap-3">
        <div className="font-semibold">MJCF Editor</div>
        <div className="opacity-60 text-sm">Primitives • Hierarchy • Live XML</div>
      </header>
      <aside className="border-r overflow-auto">
        <PrimitivePalette />
        <HierarchyTree />
      </aside>
      <main className="overflow-hidden">
        <MujocoViewer />
      </main>
      <section className="border-l overflow-hidden flex flex-col">
        <XmlPreview />
        <Inspector />
      </section>
    </div>
  );
}


