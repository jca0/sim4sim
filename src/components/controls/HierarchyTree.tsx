"use client";

import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Button } from "@/components/ui/button";
// Panels should render body-only (no cards)
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers3, Box, MoreVertical } from "lucide-react";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
// removed unused alias import

export default function HierarchyTree() {
  const nodes = useMjcfEditorStore((s) => s.nodes);
  const selection = useMjcfEditorStore((s) => s.selection);
  const selections = useMjcfEditorStore((s) => s.selections);
  const select = useMjcfEditorStore((s) => s.select);
  const selectOne = useMjcfEditorStore((s) => s.selectOne);
  const selectToggle = useMjcfEditorStore((s) => s.selectToggle);
  const selectRangeTo = useMjcfEditorStore((s) => s.selectRangeTo);
  const deleteSelected = useMjcfEditorStore((s) => s.deleteSelected);
  const renameSelected = useMjcfEditorStore((s) => s.renameSelected);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState<string>("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const startRename = (id: string, currentName: string) => {
    select(id);
    setEditingId(id);
    setDraftName(currentName);
  };

  const commitRename = () => {
    if (!editingId) return;
    const name = draftName.trim();
    if (name) {
      select(editingId);
      renameSelected(name);
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  // Exit rename when selection changes or deselects
  React.useEffect(() => {
    if (editingId && selection !== editingId) {
      setEditingId(null);
    }
  }, [selection, editingId]);

  // Deselect when clicking anywhere outside the explorer container
  React.useEffect(() => {
    const onGlobalMouseDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) {
        if (editingId) {
          // defer to allow input onBlur to commit first
          setTimeout(() => {
            selectOne(null);
            setEditingId(null);
          }, 0);
        } else {
          selectOne(null);
        }
      }
    };
    document.addEventListener('mousedown', onGlobalMouseDown, true);
    return () => document.removeEventListener('mousedown', onGlobalMouseDown, true);
  }, [editingId, selectOne]);

  // Keyboard shortcuts like VS Code: F2 rename, Delete already handled globally
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'F2') {
      e.preventDefault();
      const sel = selection;
      if (!sel) return;
      const node = nodes.find(n => n.id === sel);
      if (!node) return;
      startRename(sel, node.name);
    }
    if (e.key === 'Enter' && !editingId) {
      // VS Code: Enter starts rename on focused/selected item
      e.preventDefault();
      const sel = selection;
      if (!sel) return;
      const node = nodes.find(n => n.id === sel);
      if (!node) return;
      startRename(sel, node.name);
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !editingId) {
      e.preventDefault();
      deleteSelected();
    }
    if (e.key === 'Escape' && editingId) {
      e.preventDefault();
      setEditingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="py-0.5 outline-none"
            onMouseDown={(e) => {
              // Clicking empty space clears selection
              if (e.currentTarget === e.target) {
                selectOne(null);
              }
            }}
          >
            {nodes.map((n) => (
              <ContextMenu key={n.id}>
                <ContextMenuTrigger className="w-full">
                    <div
                      className={`w-full flex items-center gap-2 px-2 py-1 text-[11px] cursor-pointer ${
                        selections.includes(n.id)
                          ? 'bg-[var(--vscode-list-activeSelectionBackground,#094771)] text-[var(--vscode-list-activeSelectionForeground,#fff)]'
                          : 'hover:bg-[var(--vscode-list-hoverBackground,#2a2d2e)]'
                      }`}
                      onClick={(e) => {
                        if (e.shiftKey) {
                          selectRangeTo(n.id);
                        } else if (e.metaKey || e.ctrlKey) {
                          selectToggle(n.id);
                        } else {
                          selectOne(n.id);
                        }
                      }}
                      onContextMenu={() => selectOne(n.id)}
                    >
                      <Box className="mr-2 h-3.5 w-3.5 shrink-0 opacity-80" />
                      {editingId === n.id ? (
                        <Input
                          autoFocus
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') cancelRename();
                          }}
                          className="h-5 text-[11px] font-mono px-1.5 w-40"
                        />
                      ) : (
                        <span className="font-mono text-[11px] truncate">{n.name}</span>
                      )}
                      <div className="ml-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="opacity-70 p-1 rounded-full transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectOne(n.id);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                              aria-label="Open menu"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()}>
                            <DropdownMenuItem onClick={() => startRename(n.id, n.name)}>
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                selectOne(n.id);
                                deleteSelected();
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => startRename(n.id, n.name)}>
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      select(n.id);
                      deleteSelected();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}


