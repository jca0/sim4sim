"use client";
import dynamic from "next/dynamic";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { useEffect } from "react";



const VscodeShell = dynamic(() => import("@/components/vscode/VscodeShell"), { ssr: false });

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
  return <VscodeShell />;
}


