"use client";

import * as React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/CodeBlock";

type Role = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

// --- Markdown custom renderers ---
const markdownComponents: Components = {
  code({
    inline,
    className,
    children,
    ...props
  }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
    inline?: boolean;
  }) {
    const language = /language-(\w+)/.exec(className || "")?.[1];

    if (inline) {
      return (
        <code
          className="rounded-md bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[13px] font-mono text-zinc-800 dark:text-zinc-100"
          {...props}
        >
          {children}
        </code>
      );
    }

    return <CodeBlock code={String(children).trim()} language={language} />;
  },

  // Prevent <pre> inside <p>
  pre({ children }) {
    return <>{children}</>;
  },
};

// --- Chat bubble ---
export function ChatBubble({
  message,
  className,
  onReply,
}: {
  message: ChatMessage;
  className?: string;
  onReply?: (message: ChatMessage) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        "flex w-full items-start gap-3 animate-fadeIn",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className="group flex flex-col items-start gap-1">
        {/* Bubble */}
        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-primary text-white rounded-br-sm"
              : "bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-bl-sm",
            className
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div className="prose prose-sm prose-zinc dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Reply button (only assistant) */}
        {!isUser && onReply ? (
          <button
            type="button"
            onClick={() => onReply(message)}
            className="ml-2 text-xs text-muted-foreground hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Reply
          </button>
        ) : null}
      </div>
    </div>
  );
}
