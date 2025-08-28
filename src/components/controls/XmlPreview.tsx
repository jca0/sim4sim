"use client";

import { useEffect, useRef, useState } from "react";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Code } from "lucide-react";
import dynamic from "next/dynamic";
import { parseMjcfXml } from "@/lib/mjcf/xmlParse";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

export default function XmlPreview() {
  const xml = useMjcfEditorStore((s) => s.xml);
  const setXml = useMjcfEditorStore((s) => s.setXml);
  const [draft, setDraft] = useState<string>(xml);
  const [error, setError] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const editorRef = useRef<any>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastAppliedStoreXmlRef = useRef<string>(xml);
  const pendingSyncTimeoutRef = useRef<number | null>(null);

  // Do not resync draft from xml while typing to avoid cursor jump

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

  // Sync incoming store XML (e.g., from hierarchy changes) into editor when user is idle/not focused
  useEffect(() => {
    if (xml === lastAppliedStoreXmlRef.current) return;
    if (xml === draft) {
      lastAppliedStoreXmlRef.current = xml;
      return;
    }

    const attemptApply = () => {
      const editorHasFocus = editorRef.current?.hasTextFocus?.() ?? false;
      if (!isTypingRef.current && !editorHasFocus) {
        setDraft(xml);
        setError(null);
        lastAppliedStoreXmlRef.current = xml;
        if (pendingSyncTimeoutRef.current) {
          window.clearTimeout(pendingSyncTimeoutRef.current);
          pendingSyncTimeoutRef.current = null;
        }
      } else {
        if (pendingSyncTimeoutRef.current) {
          window.clearTimeout(pendingSyncTimeoutRef.current);
        }
        pendingSyncTimeoutRef.current = window.setTimeout(attemptApply, 300);
      }
    };

    attemptApply();

    return () => {
      if (pendingSyncTimeoutRef.current) {
        window.clearTimeout(pendingSyncTimeoutRef.current);
        pendingSyncTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xml]);

  const download = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Live validation and application happens in onChange of the editor below

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <CardHeader ref={headerRef} className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm flex items-center">
          <Code className="mr-2 h-4 w-4" />
          {"XML Editor"}
        </CardTitle>
        <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
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
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="xml"
              path="xml-editor.mjcf.xml"
              keepCurrentModel
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              value={draft}
              onChange={(val) => {
                const text = val ?? "";
                setDraft(text);
                setError(null);

                // Mark as typing and reset idle timer
                isTypingRef.current = true;
                if (typingTimeoutRef.current) {
                  window.clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = window.setTimeout(() => {
                  isTypingRef.current = false;
                }, 500);

                // Debounce applying to store to avoid cursor jumps
                if (debounceRef.current) {
                  window.clearTimeout(debounceRef.current);
                }
                debounceRef.current = window.setTimeout(() => {
                  try {
                    parseMjcfXml(text);
                    setXml(text);
                    lastAppliedStoreXmlRef.current = text;
                    setError(null);
                  } catch {
                    setError("XML is not valid. Fix the errors and try again.");
                  }
                }, 250);
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
      </CardContent>
    </Card>
  );
}