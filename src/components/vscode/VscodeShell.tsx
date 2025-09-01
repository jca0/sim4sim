"use client";

import HierarchyTree from "@/components/controls/HierarchyTree";
import XmlPreview from "@/components/controls/XmlPreview";
import Inspector from "@/components/controls/Inspector";
import MujocoViewer from "@/components/MujocoViewer";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { useEffect, useRef, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";

export default function VscodeShell() {
  const deleteSelected = useMjcfEditorStore((s) => s.deleteSelected);
  const undo = useMjcfEditorStore((s) => s.undo);
  const redo = useMjcfEditorStore((s) => s.redo);
  const leftRef = useRef<ImperativePanelHandle | null>(null);
  const rightRef = useRef<ImperativePanelHandle | null>(null);
  const bottomRef = useRef<ImperativePanelHandle | null>(null);

  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);

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

  const toggleBottom = () => {
    if (isBottomCollapsed) {
      bottomRef.current?.expand?.();
      setIsBottomCollapsed(false);
    } else {
      bottomRef.current?.collapse?.();
      setIsBottomCollapsed(true);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
          return;
        }
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
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
    <div className="grid grid-rows-[28px_1fr_22px] h-screen bg-[var(--vscode-editor-background,#1e1e1e)] text-[var(--vscode-foreground,#d4d4d4)]">
      {/* Title Bar */}
      <div className="row-start-1 row-end-2 flex items-center justify-between px-3 text-xs border-b border-[var(--vscode-titleBar-border,#333)] bg-[var(--vscode-titleBar-activeBackground,#3c3c3c)] text-[var(--vscode-titleBar-activeForeground,#ccc)]">
        <div className="flex items-center gap-2">
          <span className="codicon codicon-vm-outline" />
          <span>Visual Studio Code — MJCF Editor</span>
        </div>
        <div className="opacity-60">●●●</div>
      </div>

      {/* Workbench */}
      <div className="row-start-2 row-end-3 grid grid-cols-[48px_1fr] min-h-0">
        {/* Activity Bar */}
        <aside className="border-r border-[var(--vscode-sideBar-border,#2a2a2a)] bg-[var(--vscode-activityBar-background,#333333)] flex flex-col items-center justify-between py-2">
          <div className="flex flex-col items-center gap-1">
            <button className="h-10 w-10 rounded hover:bg-white/10 flex items-center justify-center" title="Explorer" onClick={toggleLeft}>
              <span className="codicon codicon-files text-[18px]" />
            </button>
            <button className="h-10 w-10 rounded hover:bg-white/10 flex items-center justify-center" title="Search">
              <span className="codicon codicon-search text-[18px] opacity-70" />
            </button>
            <button className="h-10 w-10 rounded hover:bg-white/10 flex items-center justify-center" title="Source Control">
              <span className="codicon codicon-source-control text-[18px] opacity-70" />
            </button>
            <button className="h-10 w-10 rounded hover:bg-white/10 flex items-center justify-center" title="Run and Debug">
              <span className="codicon codicon-debug-alt text-[18px] opacity-70" />
            </button>
            <button className="h-10 w-10 rounded hover:bg-white/10 flex items-center justify-center" title="Extensions">
              <span className="codicon codicon-extensions text-[18px] opacity-70" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button className="h-10 w-10 rounded hover:bg-white/10 flex items-center justify-center" title="Settings" onClick={toggleRight}>
              <span className="codicon codicon-settings-gear text-[18px]" />
            </button>
          </div>
        </aside>

        {/* Main + Sidebars */}
        <div className="min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Side Bar (Explorer) */}
            <ResizablePanel ref={leftRef} collapsible collapsedSize={0} defaultSize={22} minSize={15} className="bg-[var(--vscode-sideBar-background,#252526)] border-r border-[var(--vscode-sideBar-border,#2a2a2a)] overflow-hidden flex flex-col">
              <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-[var(--vscode-sideBarTitle-foreground,#cccccc)] border-b border-[var(--vscode-sideBar-border,#2a2a2a)]">Explorer</div>
              <div className="p-2 overflow-auto flex-1">
                <HierarchyTree />
              </div>
            </ResizablePanel>
            <ResizableHandle />

            {/* Editor Group + Bottom Panel + Secondary Side Bar */}
            <ResizablePanel defaultSize={56} minSize={35} className="overflow-hidden">
              <ResizablePanelGroup direction="vertical" className="h-full">
                {/* Editor Group */}
                <ResizablePanel defaultSize={76} minSize={40} className="flex flex-col bg-[var(--vscode-editor-background,#1e1e1e)]">
                  {/* Editor Tabs Bar */}
                  <div className="h-9 flex items-end border-b border-[var(--vscode-editorGroup-border,#2d2d2d)] bg-[var(--vscode-editorGroupHeader-tabsBackground,#252526)]">
                    <div className="h-full flex items-center gap-2 px-2 text-[12px]">
                      <div className="h-full px-3 flex items-center gap-2 bg-[var(--vscode-tab-activeBackground,#1e1e1e)] text-[var(--vscode-tab-activeForeground,#fff)] border-r border-[var(--vscode-editorGroup-border,#2d2d2d)]">
                        <span className="codicon codicon-globe" />
                        <span>Scene</span>
                      </div>
                    </div>
                  </div>
                  {/* Editor Content */}
                  <div className="flex-1 min-h-0">
                    <MujocoViewer />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                {/* Bottom Panel */}
                <ResizablePanel ref={bottomRef} collapsible collapsedSize={0} defaultSize={24} minSize={12} className="bg-[var(--vscode-panel-background,#1e1e1e)] border-t border-[var(--vscode-panel-border,#2a2a2a)] overflow-hidden">
                  <div className="h-8 flex items-end border-b border-[var(--vscode-panel-border,#2a2a2a)] bg-[var(--vscode-panelTitle-activeForeground,#e7e7e7)]/5">
                    <div className="h-full flex items-center gap-4 px-3 text-[12px]">
                      <button className="px-2 h-full border-b-2 border-[var(--vscode-panelTitle-activeBorder,#3794ff)]">XML</button>
                      <button className="px-2 h-full opacity-60" onClick={toggleBottom}>Problems</button>
                    </div>
                  </div>
                  <div className="h-[calc(100%-2rem)] overflow-auto p-2">
                    <XmlPreview />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle />
            {/* Secondary Side Bar (Right) */}
            <ResizablePanel ref={rightRef} collapsible collapsedSize={0} defaultSize={22} minSize={15} className="bg-[var(--vscode-sideBar-background,#252526)] border-l border-[var(--vscode-sideBar-border,#2a2a2a)] overflow-hidden flex flex-col">
              <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-[var(--vscode-sideBarTitle-foreground,#cccccc)] border-b border-[var(--vscode-sideBar-border,#2a2a2a)]">Inspector</div>
              <div className="p-2 h-full overflow-auto">
                <Inspector />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Status Bar */}
      <div className="row-start-3 row-end-4 h-[22px] text-[11px] flex items-center justify-between px-3 bg-[var(--vscode-statusBar-background,#007acc)] text-[var(--vscode-statusBar-foreground,#ffffff)]">
        <div className="flex items-center gap-3">
          <span className="codicon codicon-check" /> Ready
        </div>
        <div className="opacity-90">UTF-8  LF  TypeScript React</div>
      </div>
    </div>
  );
}


