"use client";

import * as React from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { ChatBubble, type ChatMessage } from "@/components/chat-bubble";
import { ChatInput } from "@/components/chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { sendChatMessage, listChatSessions, getSessionMessages } from "@/lib/chat";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useChatSessions } from "@/components/chat-sessions-provider";

type Chat = { id: string; title: string; messages: ChatMessage[]; sessionId?: string };

function useAssistant() {
  const [isThinking, setIsThinking] = React.useState(false);
  const send = async (text: string, sessionId?: string): Promise<{ content: string; sessionId?: string }> => {
    setIsThinking(true);
    try {
      const res = await sendChatMessage({ message: text, session_id: sessionId });
      return { content: res.message.content, sessionId: res.session_id };
    } finally {
      setIsThinking(false);
    }
  };
  return { isThinking, send };
}

function deriveTitleFromReply(text: string): string {
  const withoutCode = text.replace(/```[\s\S]*?```/g, "");
  const firstLine = withoutCode.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
  const sentence = firstLine.split(/(?<=[.!?])\s+/)[0] || firstLine;
  const cleaned = sentence.replace(/[#*_>`~]/g, "").trim();
  const title = cleaned || "Chat";
  return title.length > 60 ? `${title.slice(0, 57)}...` : title;
}

export default function ChatClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const { isThinking, send } = useAssistant();
  const { upsertSession } = useChatSessions();

  const active = chats.find((c) => c.id === activeId);

  const onNewChat = () => {
    const id = Math.random().toString(36).slice(2);
    const newChat: Chat = { id, title: "New Chat", messages: [] };
    setChats((prev) => [newChat, ...prev]);
    setActiveId(id);
  };

  const onSend = async (value: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: value };
    setChats((prev) => prev.map((c) => (c.id === activeId ? { ...c, messages: [...c.messages, userMsg] } : c)));
    const current = chats.find((c) => c.id === activeId);
    const prevSessionId = current?.sessionId;
    try {
      const result = await send(value, prevSessionId);
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: result.content };
      const maybeTitle = !prevSessionId && result.sessionId ? deriveTitleFromReply(result.content) : undefined;
      setChats((prev) => prev.map((c) => {
        if (c.id !== activeId) return c;
        const newSessionId = result.sessionId ?? c.sessionId;
        const updated: Chat = {
          ...c,
          sessionId: newSessionId,
          title: maybeTitle ? maybeTitle : c.title,
          messages: [...c.messages, aiMsg],
        };
        if (!prevSessionId && result.sessionId) {
          updated.id = result.sessionId;
        }
        return updated;
      }));
      if (!prevSessionId && result.sessionId) {
        setActiveId(result.sessionId);
        try { router.replace(`/chat?c=${result.sessionId}`); } catch {}
        const title = deriveTitleFromReply(result.content);
        upsertSession({ id: result.sessionId, title });
      }
    } catch (err: any) {
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: err?.message || "Failed to get response." };
      setChats((prev) => prev.map((c) => (c.id === activeId ? { ...c, messages: [...c.messages, aiMsg] } : c)));
    }
  };

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
          messages: (s.messages || []).map((m) => ({ id: String(m.id), role: m.role as ChatMessage["role"], content: m.content })),
        }));
        if (mapped.length > 0) {
          setChats(mapped);
          setSidebarOpen(true);
        } else {
          // No sessions yet: create a fresh local chat so UI is visible
          const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
          const fresh: Chat = { id, title: "New Chat", messages: [] };
          setChats([fresh]);
          setActiveId(id);
        }
        const params = new URLSearchParams(window.location.search);
        const idParam = params.get("c");
        if (idParam && (mapped.length ? mapped.some((c) => c.id === idParam) : idParam)) {
          setActiveId(idParam);
          if (mapped.length > 0) setSidebarOpen(true);
        } else if (mapped.length > 0) {
          setActiveId(mapped[0]?.id ?? null);
        }
      } catch {
        // ignore; user may have no sessions
        const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        const fresh: Chat = { id, title: "New Chat", messages: [] };
        setChats([fresh]);
        setActiveId(id);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Load messages when session id in URL changes
  React.useEffect(() => {
    const id = searchParams.get("c");
    if (!id) return;
    setActiveId(id);
    let cancelled = false;
    (async () => {
      try {
        const msgs = await getSessionMessages(id);
        if (cancelled) return;
        const mapped = msgs.map((m) => ({ id: String(m.id), role: m.role as ChatMessage["role"], content: m.content }));
        setChats((prev) => {
          const exists = prev.find((c) => c.id === id);
          if (exists) {
            return prev.map((c) => (c.id === id ? { ...c, sessionId: id, messages: mapped } : c));
          }
          return [{ id, title: "Chat", sessionId: id, messages: mapped }, ...prev];
        });
      } catch {
        // If 404 or error, do nothing for now; user may not own the session
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const didMountRef = React.useRef(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active ? active.messages.length : 0, isThinking]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !activeId || !active) {
    return null;
  }

  return (
    <div className="flex min-h-dvh w-full">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={false}
        chats={chats.map(({ id, title }) => ({ id, title }))}
        onNewChat={onNewChat}
      />

      <div className="flex flex-1 flex-col">
        <Navbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <div className="container mx-auto grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-2 p-4">
          <ScrollArea className="min-h-0 rounded-md p-3">
            <div className="mx-auto flex max-w-3xl flex-col gap-3">
              {(active?.messages ?? []).map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
              {isThinking && (
                <div className="text-sm text-muted-foreground">Akili is typing…</div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="mx-auto w-full max-w-3xl">
            <ChatInput
              onSend={onSend}
              disabled={isThinking || !active}
              placeholder={active && active.messages.length === 0 ? "What's on your mind today?" : undefined}
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for newline
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


