"use client";

import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useMjcfEditorStore as useStore } from "@/contexts/MjcfEditorStore";

export default function HierarchyTree() {
  const nodes = useMjcfEditorStore((s) => s.nodes);
  const selection = useMjcfEditorStore((s) => s.selection);
  const select = useMjcfEditorStore((s) => s.select);
  const deleteSelected = useMjcfEditorStore((s) => s.deleteSelected);
  const renameSelected = useMjcfEditorStore((s) => s.renameSelected);

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center">
          <Layers3 className="mr-2 h-4 w-4" />
          Hierarchy
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-1">
            {nodes.map((n) => (
              <ContextMenu key={n.id}>
                <ContextMenuTrigger className="w-full">
                  <Button
                    asChild
                    variant={selection === n.id ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-2 cursor-pointer"
                  >
                    <div
                      className="w-full flex items-center gap-2"
                      onClick={() => select(n.id)}
                      onContextMenu={() => select(n.id)}
                    >
                      <Box className="mr-2 h-3 w-3 shrink-0" />
                      <Badge variant="outline" className="mr-2 text-xs">
                        body
                      </Badge>
                      <span className="font-mono text-xs truncate">{n.name}</span>
                      <div className="ml-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="opacity-70 p-1 rounded-full transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                select(n.id);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                              aria-label="Open menu"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()}>
                            <DropdownMenuItem
                              onClick={() => {
                                const newName = window.prompt("Rename body", n.name)?.trim();
                                if (newName) {
                                  select(n.id);
                                  renameSelected(newName);
                                }
                              }}
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                select(n.id);
                                deleteSelected();
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => {
                      const newName = window.prompt("Rename body", n.name)?.trim();
                      if (newName) {
                        select(n.id);
                        renameSelected(newName);
                      }
                    }}
                  >
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
      </CardContent>
    </Card>
  );
}


