"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import ChatClient from "@/components/chat-client";
import { getStoredUser } from "@/lib/auth";
import { ChatSessionsProvider } from "@/components/chat-sessions-provider";

export default function ChatPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/auth/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <ChatSessionsProvider>
      <ChatClient />
    </ChatSessionsProvider>
  );
}
