"use client";

import { useEffect, useRef, useState } from "react";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Code, Edit, Eye, X } from "lucide-react";
import dynamic from "next/dynamic";
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { parseMjcfXml } from "@/lib/mjcf/xmlParse";

const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((m) => m.Prism),
  { ssr: false }
);

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

export default function XmlPreview() {
  const xml = useMjcfEditorStore((s) => s.xml);
  const setXml = useMjcfEditorStore((s) => s.setXml);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setDraft(xml);
      setError(null);
    }
  }, [isEditMode, xml]);

  // Make header actions responsive to available width in the right pane
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setCompact(w < 360); // threshold where labels start to overflow
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const download = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onApply = () => {
    try {
      // Validate first so we don't silently drop edits
      parseMjcfXml(draft);
      setXml(draft);
      setIsEditMode(false);
      setError(null);
    } catch {
      setError("XML is not valid. Fix the errors and try again.");
    }
  };

  const onCancel = () => {
    setDraft(xml);
    setError(null);
    setIsEditMode(false);
  };

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <CardHeader ref={headerRef} className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm flex items-center">
          <Code className="mr-2 h-4 w-4" />
          {isEditMode ? "XML Editor" : "XML Output"}
        </CardTitle>
        <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
          {isEditMode ? (
            <>
              <Button
                onClick={onApply}
                size="sm"
                variant="default"
                className="h-8 cursor-pointer hover:scale-105 transition-transform"
              >
                <Eye className={`h-3 w-3 ${compact ? 'mr-0' : 'mr-2'}`} />
                {!compact && <span>Apply</span>}
              </Button>
              <Button
                onClick={onCancel}
                size="sm"
                variant="outline"
                className="h-8 cursor-pointer"
              >
                <X className={`h-3 w-3 ${compact ? 'mr-0' : 'mr-2'}`} />
                {!compact && <span>Cancel</span>}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditMode(true)}
              size="sm"
              variant="outline"
              className="h-8 cursor-pointer hover:scale-105 transition-transform"
            >
              <Edit className={`h-3 w-3 ${compact ? 'mr-0' : 'mr-2'}`} />
              {!compact && <span>Edit</span>}
            </Button>
          )}
          <Button
            onClick={download}
            size="sm"
            variant="outline"
            className="h-8 cursor-pointer hover:scale-105 transition-transform"
          >
            <Download className={`h-3 w-3 ${compact ? 'mr-0' : 'mr-2'}`} />
            {!compact && <span>Download</span>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
        {isEditMode ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                height="100%"
                defaultLanguage="xml"
                value={draft}
                onChange={(val) => {
                  setDraft(val ?? "");
                  if (error) setError(null);
                }}
                options={{
                  wordWrap: "on",
                  minimap: { enabled: false },
                  folding: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
            {error && (
              <div className="px-4 py-2 text-xs text-red-600">{error}</div>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full">
            <SyntaxHighlighter
              language="xml"
              style={tomorrow}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'hsl(var(--muted) / 0.5)',
                fontSize: '0.75rem',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                width: '100%',
                maxWidth: '100%'
              }}
              showLineNumbers={false}
              wrapLines={true}
              wrapLongLines={true}
            >
              {xml || '<!-- No XML content -->'}
            </SyntaxHighlighter>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}