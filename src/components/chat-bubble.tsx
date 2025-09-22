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

export function ChatBubble({ message, className }: { message: ChatMessage; className?: string }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex w-full items-start gap-3", isUser ? "justify-end" : "justify-start")}> 
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
          isUser ? "bg-foreground text-background rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm",
          className
        )}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="prose prose-zinc dark:prose-invert prose-pre:rounded-lg prose-pre:bg-zinc-950/90 prose-pre:text-zinc-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}


