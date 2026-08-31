"use client";

import React, { useMemo } from "react";
import { CopyButton } from "./CopyButton";

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "h4"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "alert"; kind: "note" | "tip" | "warning" | "important"; text: string };

function parseInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(<code key={key++} className="inline-code">{codeMatch[1]}</code>);
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    const nextSpecial = remaining.search(/[`*]/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

export function MarkdownRenderer({ content, className = "rich-markdown" }: { content: string; className?: string }) {
  const blocks = useMemo(() => {
    const rawBlocks = content.split(/\n{2,}/);
    const parsed: Block[] = [];

    for (const raw of rawBlocks) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("```")) {
        const lines = trimmed.split("\n");
        const firstLine = lines[0];
        const lastLine = lines[lines.length - 1];

        if (lines.length > 1 && lastLine.startsWith("```")) {
          const lang = firstLine.slice(3).trim() || "text";
          const code = lines.slice(1, -1).join("\n");
          parsed.push({ type: "code", lang, code });
          continue;
        }
      }

      if (trimmed.startsWith("#### ")) {
        parsed.push({ type: "h4", text: trimmed.slice(5) });
      } else if (trimmed.startsWith("### ")) {
        parsed.push({ type: "h3", text: trimmed.slice(4) });
      } else if (trimmed.startsWith("## ")) {
        parsed.push({ type: "h2", text: trimmed.slice(3) });
      } else if (trimmed.startsWith("> [!TIP]") || trimmed.startsWith("> [!NOTE]") || trimmed.startsWith("> [!WARNING]") || trimmed.startsWith("> [!IMPORTANT]")) {
        const lines = trimmed.split("\n");
        const header = lines[0];
        let kind: "note" | "tip" | "warning" | "important" = "note";
        if (header.includes("!TIP")) kind = "tip";
        if (header.includes("!WARNING")) kind = "warning";
        if (header.includes("!IMPORTANT")) kind = "important";

        const text = lines.slice(1).map(l => l.replace(/^>\s?/, "")).join(" ");
        parsed.push({ type: "alert", kind, text });
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed.split("\n").filter(l => l.startsWith("- ") || l.startsWith("* ")).map(l => l.replace(/^[-*]\s+/, ""));
        parsed.push({ type: "ul", items });
      } else if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split("\n").filter(l => /^\d+\.\s/.test(l)).map(l => l.replace(/^\d+\.\s+/, ""));
        parsed.push({ type: "ol", items });
      } else {
        parsed.push({ type: "p", text: trimmed });
      }
    }

    return parsed;
  }, [content]);

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return <h3 key={i} className="markdown-h2">{parseInline(block.text)}</h3>;
          case "h3":
            return <h4 key={i} className="markdown-h3">{parseInline(block.text)}</h4>;
          case "h4":
            return <h5 key={i} className="markdown-h4">{parseInline(block.text)}</h5>;
          case "p":
            return <p key={i} className="markdown-p">{parseInline(block.text)}</p>;
          case "ul":
            return (
              <ul key={i} className="markdown-ul">
                {block.items.map((item, idx) => (
                  <li key={idx}>{parseInline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="markdown-ol">
                {block.items.map((item, idx) => (
                  <li key={idx}>{parseInline(item)}</li>
                ))}
              </ol>
            );
          case "code":
            return (
              <div key={i} className="markdown-code-block">
                <div className="markdown-code-header">
                  <span className="markdown-code-lang">{block.lang}</span>
                  <CopyButton text={block.code} label="Copy" copiedLabel="Copied!" className="btn ghost copy-code-btn" />
                </div>
                <pre className="markdown-pre">
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          case "alert":
            return (
              <div key={i} className={`markdown-alert markdown-alert--${block.kind}`}>
                <div className="markdown-alert-tag">{block.kind.toUpperCase()}</div>
                <p>{parseInline(block.text)}</p>
              </div>
            );
        }
      })}
    </div>
  );
}
