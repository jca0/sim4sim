"use client";
import PrimitivePalette from "@/components/controls/PrimitivePalette";
import HierarchyTree from "@/components/controls/HierarchyTree";
import XmlPreview from "@/components/controls/XmlPreview";
import Inspector from "@/components/controls/Inspector";
import MujocoViewer from "@/components/MujocoViewer";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";



export default function EditorPage() {
  return (
    <div className="grid grid-cols-[260px_1fr_420px] grid-rows-[auto_1fr] h-screen bg-background">
      <header className="col-span-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2 flex items-center gap-3">
        <div className="font-semibold">MJCF Editor</div>
        <div className="opacity-60 text-sm">Primitives • Hierarchy • Live XML</div>
      </header>
      <aside className="bg-muted/30 overflow-auto p-3 space-y-4">
        <PrimitivePalette />
        <HierarchyTree />
      </aside>
      <main className="overflow-hidden">
        <MujocoViewer />
      </main>
      <section className="bg-muted/30 overflow-auto flex flex-col p-3 space-y-4">
        <div className="flex-shrink-0">
          <XmlPreview />
        </div>
        <div className="flex-1 min-h-0">
          <Inspector />
        </div>
      </section>
    </div>
  );
}


