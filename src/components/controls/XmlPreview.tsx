"use client";

import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";

export default function XmlPreview() {
  const xml = useMjcfEditorStore((s) => s.xml);

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
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-semibold opacity-70">XML</div>
        <button
          onClick={download}
          className="text-xs border rounded px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
        >
          Download
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-3 text-xs bg-black/5 dark:bg-white/5 whitespace-pre-wrap break-words">
{xml}
      </pre>
    </div>
  );
}


