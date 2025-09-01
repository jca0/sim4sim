"use client";
import PrimitivePalette from "@/components/controls/PrimitivePalette";
import HierarchyTree from "@/components/controls/HierarchyTree";
import XmlPreview from "@/components/controls/XmlPreview";
import Inspector from "@/components/controls/Inspector";
import MujocoViewer from "@/components/MujocoViewer";
import dynamic from "next/dynamic";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { useEffect, useRef, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, GitBranch, Play, Puzzle, Settings, Layers3 } from "lucide-react";
import type { ImperativePanelHandle } from "react-resizable-panels";



const VscodeShell = dynamic(() => import("@/components/vscode/VscodeShell"), { ssr: false });

export default function EditorPage() {
  const deleteSelected = useMjcfEditorStore((s) => s.deleteSelected);
  const undo = useMjcfEditorStore((s) => s.undo);
  const redo = useMjcfEditorStore((s) => s.redo);
  const leftRef = useRef<ImperativePanelHandle | null>(null);
  const rightRef = useRef<ImperativePanelHandle | null>(null);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [leftSize, setLeftSize] = useState<number>(22);
  const [rightSize, setRightSize] = useState<number>(22);

  const toggleLeft = () => {
    if (isLeftCollapsed) {
      leftRef.current?.expand?.();
      setIsLeftCollapsed(false);
    } else {
      leftRef.current?.collapse?.();
      setIsLeftCollapsed(true);
    }
  };
  const toggleRight = () => {
    if (isRightCollapsed) {
      rightRef.current?.expand?.();
      setIsRightCollapsed(false);
    } else {
      rightRef.current?.collapse?.();
      setIsRightCollapsed(true);
    }
  };

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


