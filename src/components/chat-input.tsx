"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
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

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {replyTo ? (
        <div className="flex items-start justify-between rounded-md border p-2 text-xs text-muted-foreground">
          <div className="pr-2">
            <div className="font-medium text-foreground">Replying to assistant</div>
            <div className="mt-1 line-clamp-2 whitespace-pre-wrap">{replyTo.preview}</div>
            <div className="mt-1 text-[10px] opacity-70">ref:{replyTo.id}</div>
          </div>
          {onCancelReply ? (
            <button type="button" onClick={onCancelReply} className="ml-2 rounded px-2 py-1 hover:bg-muted">Cancel</button>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-end gap-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Send a message..."}
        className="min-h-12 max-h-40 w-full resize-y"
        disabled={disabled || isSubmitting}
      />
      <Button onClick={handleSubmit} disabled={disabled || isSubmitting} className="shrink-0">
        <Send className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Send</span>
      </Button>
      </div>
    </div>
  );
}


