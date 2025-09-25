"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInput({
  onSend,
  disabled,
  className,
  placeholder,
  replyTo,
  onCancelReply,
}: {
  onSend: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  replyTo?: { id: string; preview: string };
  onCancelReply?: () => void;
}) {
  const [value, setValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      onSend(trimmed);
      setValue("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // --- auto-grow textarea ---
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`; // cap at ~8 lines
  }, [value]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {replyTo && (
        <div className="flex items-start justify-between rounded-lg border bg-muted/40 p-2 text-xs">
          <div className="pr-2">
            <div className="font-medium text-foreground">
              Replying to assistant
            </div>
            <div className="mt-1 line-clamp-2 whitespace-pre-wrap text-muted-foreground">
              {replyTo.preview}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground/70">
              ref:{replyTo.id}
            </div>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-2 rounded p-1 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Input container with button inside */}
      <div className="relative flex items-center">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? "Send a message..."}
          className="w-full resize-none rounded-lg pr-12 px-3 py-2 text-sm shadow-sm focus-visible:ring-1"
          disabled={disabled || isSubmitting}
          rows={1}
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || isSubmitting}
          size="icon"
          className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
