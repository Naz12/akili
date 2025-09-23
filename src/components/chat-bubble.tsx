"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

function parseReplyPrefix(content: string): { refId: string; preview: string; rest: string } | null {
  const re = /^"""\[ref:([^\]]+)\]\n([\s\S]*?)\n"""\n\n/;
  const match = content.match(re);
  if (!match) return null;
  const [, refId, preview] = match;
  const rest = content.slice(match[0].length);
  return { refId, preview, rest };
}

function scrollToMessage(refId: string) {
  try {
    const el = document.getElementById(`msg-${refId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-blue-500");
      window.setTimeout(() => el.classList.remove("ring-2", "ring-blue-500"), 1200);
    }
  } catch {}
}

export function ChatBubble({ message, className, onReply }: { message: ChatMessage; className?: string; onReply?: (message: ChatMessage) => void }) {
  const isUser = message.role === "user";
  return (
    <div id={`msg-${message.id}`} className={cn("flex w-full items-start gap-3", isUser ? "justify-end" : "justify-start")}> 
      <div className="group flex flex-col items-start gap-1">
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
            isUser ? "bg-foreground text-background rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm",
            className
          )}
        >
          {isUser ? (
            (() => {
              const parsed = parseReplyPrefix(message.content);
              if (!parsed) {
                return <span className="whitespace-pre-wrap">{message.content}</span>;
              }
              return (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => scrollToMessage(parsed.refId)}
                    className="w-full rounded-md border border-zinc-300/60 bg-background/60 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-zinc-100 dark:border-zinc-700/60 dark:hover:bg-zinc-800"
                  >
                    <div className="font-medium text-foreground">Replying to assistant</div>
                    <div className="mt-1 whitespace-pre-wrap">{parsed.preview}</div>
                    <div className="mt-1 text-[10px] opacity-70">ref:{parsed.refId}</div>
                  </button>
                  <span className="whitespace-pre-wrap text-foreground">{parsed.rest}</span>
                </div>
              );
            })()
          ) : (
            <div className="prose prose-zinc dark:prose-invert prose-pre:rounded-lg prose-pre:bg-zinc-950/90 prose-pre:text-zinc-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && onReply ? (
          <button
            type="button"
            onClick={() => onReply(message)}
            className="ml-2 text-xs text-muted-foreground hover:underline opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            Reply
          </button>
        ) : null}
      </div>
    </div>
  );
}


