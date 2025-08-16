"use client";

import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers3, Box } from "lucide-react";

export default function HierarchyTree() {
  const nodes = useMjcfEditorStore((s) => s.nodes);
  const selection = useMjcfEditorStore((s) => s.selection);
  const select = useMjcfEditorStore((s) => s.select);

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
              <Button
                key={n.id}
                variant={selection === n.id ? "secondary" : "ghost"}
                className="w-full justify-start h-auto p-2"
                onClick={() => select(n.id)}
              >
                <Box className="mr-2 h-3 w-3 shrink-0" />
                <Badge variant="outline" className="mr-2 text-xs">
                  body
                </Badge>
                <span className="font-mono text-xs truncate">{n.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


