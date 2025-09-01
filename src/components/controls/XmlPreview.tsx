"use client";

import { useEffect, useRef, useState } from "react";
import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
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
  const debounceRef = useRef<number | null>(null);
  const editorRef = useRef<{ hasTextFocus?: () => boolean } | null>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastAppliedStoreXmlRef = useRef<string>(xml);
  const pendingSyncTimeoutRef = useRef<number | null>(null);

  // Do not resync draft from xml while typing to avoid cursor jump

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

  // Live validation and application happens in onChange of the editor below

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="xml"
              path="xml-editor.mjcf.xml"
              theme="vs-dark"
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
      </div>
    </div>
  );
}