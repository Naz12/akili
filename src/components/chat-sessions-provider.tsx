"use client";

import * as React from "react";
import { listChatSessions } from "@/lib/chat";

type Session = { id: string; title: string };

type ChatSessionsContextValue = {
  sessions: Session[];
  loading: boolean;
  refreshSessions: () => Promise<void>;
  upsertSession: (session: Session) => void;
};

const ChatSessionsContext = React.createContext<ChatSessionsContextValue | undefined>(undefined);

export function ChatSessionsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const refreshSessions = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listChatSessions({ with_messages: false });
      setSessions(data.map((s) => ({ id: s.id, title: s.title || "Untitled" })));
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertSession = React.useCallback((session: Session) => {
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === session.id);
      if (existing) {
        return prev.map((s) => (s.id === session.id ? { ...s, ...session } : s));
      }
      return [{ id: session.id, title: session.title || "Untitled" }, ...prev].slice(0, 10);
    });
  }, []);

  React.useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  const value = React.useMemo(() => ({ sessions, loading, refreshSessions, upsertSession }), [sessions, loading, refreshSessions, upsertSession]);

  return <ChatSessionsContext.Provider value={value}>{children}</ChatSessionsContext.Provider>;
}

export function useChatSessions(): ChatSessionsContextValue {
  const ctx = React.useContext(ChatSessionsContext);
  if (!ctx) throw new Error("useChatSessions must be used within ChatSessionsProvider");
  return ctx;
}


