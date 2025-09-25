"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChatBubble, type ChatMessage } from "@/components/chat-bubble";
import { ChatInput } from "@/components/chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import {
  sendChatMessage,
  listChatSessions,
  getSessionMessages,
} from "@/lib/chat";
import { useChatSessions } from "@/components/chat-sessions-provider";

// --- Types ---
type Chat = {
  id: string;
  title: string;
  messages: ChatMessage[];
  sessionId?: string;
};

// --- Hooks ---
function useAssistant() {
  const [isThinking, setIsThinking] = React.useState(false);

  const send = async (
    text: string,
    sessionId?: string
  ): Promise<{ content: string; sessionId?: string }> => {
    setIsThinking(true);
    try {
      const res = await sendChatMessage({
        message: text,
        session_id: sessionId,
      });
      return { content: res.message.content, sessionId: res.session_id };
    } finally {
      setIsThinking(false);
    }
  };

  return { isThinking, send };
}

// --- Helpers ---
function deriveTitleFromReply(text: string): string {
  const withoutCode = text.replace(/```[\s\S]*?```/g, "");
  const firstLine =
    withoutCode.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
  const sentence = firstLine.split(/(?<=[.!?])\s+/)[0] || firstLine;
  const cleaned = sentence.replace(/[#*_>`~]/g, "").trim();
  const title = cleaned || "Chat";
  return title.length > 60 ? `${title.slice(0, 57)}...` : title;
}

function useTwoLinePreview() {
  return React.useCallback((content: string): string => {
    const normalized = content.replace(/```[\s\S]*?```/g, "");
    const lines = normalized.split(/\r?\n/);
    const firstTwo = lines.slice(0, 2).join("\n");
    const needsEllipsis =
      lines.length > 2 || normalized.length > firstTwo.length;
    return needsEllipsis ? `${firstTwo}\n ...` : firstTwo;
  }, []);
}

// --- Component ---
export default function ChatClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [chats, setChats] = React.useState<Chat[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [replyTo, setReplyTo] = React.useState<ChatMessage | null>(null);
  const [mounted, setMounted] = React.useState(false);

  const { isThinking, send } = useAssistant();
  const { upsertSession } = useChatSessions();
  const toTwoLinePreview = useTwoLinePreview();

  const active = chats.find((c) => c.id === activeId);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const didMountRef = React.useRef(false);

  // --- Send message ---
  const onSend = async (value: string) => {
    if (!activeId) return;

    // UI prefix
    const displayPrefix =
      replyTo && replyTo.role === "assistant"
        ? `"""[ref:${replyTo.id}]\n${toTwoLinePreview(
            replyTo.content
          )}\n"""\n\n`
        : "";
    const userVisibleContent = `${displayPrefix}${value}`;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userVisibleContent,
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, userMsg] } : c
      )
    );

    const current = chats.find((c) => c.id === activeId);
    const prevSessionId = current?.sessionId;

    try {
      const quoted =
        replyTo && replyTo.role === "assistant"
          ? `"""[ref:${replyTo.id}]\n${replyTo.content}\n"""\n\n${value}`
          : value;

      const result = await send(quoted, prevSessionId);

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.content,
      };

      const maybeTitle =
        !prevSessionId && result.sessionId
          ? deriveTitleFromReply(result.content)
          : undefined;

      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const newSessionId = result.sessionId ?? c.sessionId;
          const updated: Chat = {
            ...c,
            sessionId: newSessionId,
            title: maybeTitle ?? c.title,
            messages: [...c.messages, aiMsg],
          };
          if (!prevSessionId && result.sessionId) {
            updated.id = result.sessionId;
          }
          return updated;
        })
      );

      setReplyTo(null);

      if (!prevSessionId && result.sessionId) {
        setActiveId(result.sessionId);
        try {
          router.replace(`/chat?c=${result.sessionId}`);
        } catch {}
        const title = deriveTitleFromReply(result.content);
        upsertSession({ id: result.sessionId, title });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to get response.";
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: message,
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, messages: [...c.messages, aiMsg] } : c
        )
      );
    }
  };

  // --- Initial load ---
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const sessions = await listChatSessions({ with_messages: true });
        if (!isMounted) return;

        const mapped: Chat[] = sessions.map((s) => ({
          id: s.id,
          title: s.title || "Untitled",
          sessionId: s.id,
          messages: (s.messages || []).map((m) => ({
            id: String(m.id),
            role: m.role as ChatMessage["role"],
            content: m.content,
          })),
        }));

        if (mapped.length > 0) {
          setChats(mapped);
        } else {
          const id =
            crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
          const fresh: Chat = { id, title: "New Chat", messages: [] };
          setChats([fresh]);
          setActiveId(id);
        }

        const idParam = searchParams.get("c");
        if (
          idParam &&
          (mapped.length ? mapped.some((c) => c.id === idParam) : idParam)
        ) {
          setActiveId(idParam);
        } else if (mapped.length > 0) {
          setActiveId(mapped[0]?.id ?? null);
        }
      } catch {
        const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
        const fresh: Chat = { id, title: "New Chat", messages: [] };
        setChats([fresh]);
        setActiveId(id);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- Reload messages when session changes ---
  React.useEffect(() => {
    const id = searchParams.get("c");
    if (!id) return;
    setActiveId(id);

    let cancelled = false;
    (async () => {
      try {
        const msgs = await getSessionMessages(id);
        if (cancelled) return;
        const mapped = msgs.map((m) => ({
          id: String(m.id),
          role: m.role as ChatMessage["role"],
          content: m.content,
        }));
        setChats((prev) => {
          const exists = prev.find((c) => c.id === id);
          if (exists) {
            return prev.map((c) =>
              c.id === id ? { ...c, sessionId: id, messages: mapped } : c
            );
          }
          return [
            { id, title: "Chat", sessionId: id, messages: mapped },
            ...prev,
          ];
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // --- Auto scroll on new message ---
  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, isThinking]);

  React.useEffect(() => setMounted(true), []);

  // --- Skeleton state ---
  if (!mounted || !activeId || !active) {
    return (
      <div className="container mx-auto grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-2 p-4">
        <div className="min-h-0 h-full rounded-md p-3">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 mx-auto w-full max-w-3xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
          <Skeleton className="h-11 w-full" />
          <div className="mt-2 text-center">
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // --- Main chat UI ---
  return (
    <div className="container mx-auto grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-2 p-4">
      <ScrollArea className="min-h-0 h-full rounded-md p-3">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {active.messages.map((m) => (
            <ChatBubble
              key={m.id}
              message={m}
              onReply={(msg) => setReplyTo(msg)}
            />
          ))}
          {isThinking && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-14 w-5/6" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="sticky bottom-0 mx-auto w-full max-w-3xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput
          onSend={onSend}
          disabled={isThinking || !active}
          placeholder={
            active.messages.length === 0
              ? "What's on your mind today?"
              : undefined
          }
          replyTo={
            replyTo?.role === "assistant"
              ? { id: replyTo.id, preview: toTwoLinePreview(replyTo.content) }
              : undefined
          }
          onCancelReply={() => setReplyTo(null)}
        />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
