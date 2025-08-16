"use client";
import PrimitivePalette from "@/components/controls/PrimitivePalette";
import HierarchyTree from "@/components/controls/HierarchyTree";
import XmlPreview from "@/components/controls/XmlPreview";
import Inspector from "@/components/controls/Inspector";
import MujocoViewer from "@/components/MujocoViewer";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { useEffect } from "react";



export default function EditorPage() {
  const deleteSelected = useMjcfEditorStore((s) => s.deleteSelected);
  const undo = useMjcfEditorStore((s) => s.undo);
  const redo = useMjcfEditorStore((s) => s.redo);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        // If Shift is also pressed, perform redo
        if (e.shiftKey) {
          e.preventDefault();
          redo();
          return;
        }
        e.preventDefault();
        undo();
        return;
      }
      // Redo alternative: Ctrl+Y (common on Windows)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }
      // Delete selected: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Avoid deleting when typing in inputs/textareas
        const target = e.target as HTMLElement | null;
        const isEditable = !!target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as HTMLElement).isContentEditable
        );
        if (!isEditable) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelected, undo, redo]);
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


