"use client";

import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Code } from "lucide-react";

export default function XmlPreview() {
  const xml = useMjcfEditorStore((s) => s.xml);
  const setXml = useMjcfEditorStore((s) => s.setXml);

  const download = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-64 flex flex-col border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
        <CardTitle className="text-sm flex items-center">
          <Code className="mr-2 h-4 w-4" />
          XML Output
        </CardTitle>
        <Button
          onClick={download}
          size="sm"
          variant="outline"
          className="h-8 cursor-pointer hover:scale-105 transition-transform"
        >
          <Download className="mr-2 h-3 w-3" />
          Download
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full">
          <textarea
            className="p-4 text-xs font-mono whitespace-pre bg-muted/50 w-full h-44 outline-none border-0 resize-none"
            value={xml}
            onChange={(e) => setXml(e.target.value)}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}