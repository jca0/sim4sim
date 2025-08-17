"use client";

import { useEffect, useState } from "react";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Code, Edit, Eye } from "lucide-react";
import dynamic from "next/dynamic";
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/themes/prism-tomorrow.css";
import { parseMjcfXml } from "@/lib/mjcf/xmlParse";

const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((m) => m.Prism),
  { ssr: false }
);

export default function XmlPreview() {
  const xml = useMjcfEditorStore((s) => s.xml);
  const setXml = useMjcfEditorStore((s) => s.setXml);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      setDraft(xml);
      setError(null);
    }
  }, [isEditMode, xml]);

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
    } catch (e) {
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
        <CardTitle className="text-sm flex items-center">
          <Code className="mr-2 h-4 w-4" />
          {isEditMode ? "XML Editor" : "XML Output"}
        </CardTitle>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button
                onClick={onApply}
                size="sm"
                variant="default"
                className="h-8 cursor-pointer hover:scale-105 transition-transform"
              >
                <Eye className="mr-2 h-3 w-3" />
                Apply
              </Button>
              <Button
                onClick={onCancel}
                size="sm"
                variant="outline"
                className="h-8 cursor-pointer"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditMode(true)}
              size="sm"
              variant="outline"
              className="h-8 cursor-pointer hover:scale-105 transition-transform"
            >
              <Edit className="mr-2 h-3 w-3" />
              Edit
            </Button>
          )}
          <Button
            onClick={download}
            size="sm"
            variant="outline"
            className="h-8 cursor-pointer hover:scale-105 transition-transform"
          >
            <Download className="mr-2 h-3 w-3" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
        {isEditMode ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <Editor
                value={draft}
                onValueChange={(code) => {
                  setDraft(code);
                  if (error) setError(null);
                }}
                highlight={(code) => Prism.highlight(code, Prism.languages.markup, "markup")}
                padding={16}
                textareaId="xml-editor"
                textareaClassName="outline-none"
                className="text-xs font-mono w-full bg-muted/50 rounded-sm focus:bg-muted/80 transition-colors"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                  fontSize: 12
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