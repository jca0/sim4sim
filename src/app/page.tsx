"use client";
import PrimitivePalette from "@/components/controls/PrimitivePalette";
import HierarchyTree from "@/components/controls/HierarchyTree";
import XmlPreview from "@/components/controls/XmlPreview";
import Inspector from "@/components/controls/Inspector";
import MujocoViewer from "@/components/MujocoViewer";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { useEffect, useRef, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ImperativePanelHandle } from "react-resizable-panels";



export default function EditorPage() {
  const deleteSelected = useMjcfEditorStore((s) => s.deleteSelected);
  const undo = useMjcfEditorStore((s) => s.undo);
  const redo = useMjcfEditorStore((s) => s.redo);
  const leftRef = useRef<ImperativePanelHandle | null>(null);
  const rightRef = useRef<ImperativePanelHandle | null>(null);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

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
  return (
    <div className="grid grid-rows-[auto_1fr] h-screen bg-background overflow-hidden">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2 flex items-center gap-3">
        <div className="font-semibold">MJCF Editor</div>
        <div className="opacity-60 text-sm">Primitives • Hierarchy • Live XML</div>
      </header>
      <div className="relative min-h-0 h-full overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="min-h-0 h-full">
          <ResizablePanel ref={leftRef} collapsible collapsedSize={0} defaultSize={22} minSize={15} className="bg-muted/30 overflow-hidden flex flex-col relative group">
          <button
            className="absolute top-0 right-[-4px] z-20 h-6 w-6 cursor-pointer opacity-70 hover:opacity-100 bg-transparent border-0 shadow-none inline-flex items-center justify-center"
            onClick={toggleLeft}
            title={isLeftCollapsed ? "Expand left" : "Collapse left"}
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
          <div className="p-3 space-y-4 overflow-auto flex-1">
            <PrimitivePalette />
            <HierarchyTree />
          </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={56} minSize={35} className="overflow-hidden">
          <MujocoViewer />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel ref={rightRef} collapsible collapsedSize={0} defaultSize={22} minSize={15} className="bg-muted/30 overflow-hidden flex flex-col relative group">
          <button
            className="absolute top-0 left-[-4px] z-20 h-6 w-6 cursor-pointer opacity-70 hover:opacity-100 bg-transparent border-0 shadow-none inline-flex items-center justify-center"
            onClick={toggleRight}
            title={isRightCollapsed ? "Expand right" : "Collapse right"}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
          <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1">
            <ResizablePanel defaultSize={45} minSize={20}>
              <div className="p-3 h-full overflow-auto">
                <XmlPreview />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={55} minSize={20}>
              <div className="p-3 h-full overflow-auto">
                <Inspector />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>

        {isLeftCollapsed && (
          <Button
            size="icon"
            variant="outline"
            className="absolute top-1/2 -translate-y-1/2 left-2 h-8 w-8 rounded-full shadow cursor-pointer"
            onClick={toggleLeft}
            title="Expand left"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        {isRightCollapsed && (
          <Button
            size="icon"
            variant="outline"
            className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 rounded-full shadow cursor-pointer"
            onClick={toggleRight}
            title="Expand right"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}


