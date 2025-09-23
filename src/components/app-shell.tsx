"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { ChatSessionsProvider } from "@/components/chat-sessions-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleNewChat = () => {
    try { router.push("/chat"); } catch {}
    setSidebarOpen(false);
  };

  return (
    <ChatSessionsProvider>
      <div className="flex min-h-dvh w-full">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={handleNewChat} />
        <div className="flex flex-1 flex-col">
          <Navbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
          {children}
        </div>
      </div>
    </ChatSessionsProvider>
  );
}


