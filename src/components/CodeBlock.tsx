"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlock({
  code,
  language,
  maxHeight = 400,
}: {
  code: string;
  language?: string;
  maxHeight?: number;
}) {
  const [copied, setCopied] = React.useState(false);
  const lines = code.split("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Failed to copy code:", e);
    }
  };

  return (
    // Use <pre> as the root so it's a proper block element in Markdown
    <pre
      data-codeblock
      className="relative rounded-lg bg-zinc-950/90 text-zinc-100 font-mono text-sm overflow-auto"
      style={{ maxHeight }}
    >
      {/* two "columns" using spans; no <div> inside <code> */}
      <code
        className={`language-${
          language ?? "text"
        } inline-flex gap-4 px-3 py-3 leading-relaxed`}
      >
        {/* Line numbers */}
        <span aria-hidden className="select-none text-right text-zinc-500/80">
          {lines.map((_, i) => (
            <span key={i} className="block tabular-nums">
              {i + 1}
            </span>
          ))}
        </span>

        {/* Code content */}
        <span className="whitespace-pre">
          {lines.map((line, i) => (
            <span key={i} className="block">
              {line || " "}
            </span>
          ))}
        </span>
      </code>

      {/* Copy button INSIDE <pre> so we don't need an outer <div> */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-zinc-800/80 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
        aria-label="Copy code"
        type="button"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </pre>
  );
}
