"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import { listChatSessions } from "@/lib/chat";
import { useChatSessions } from "@/components/chat-sessions-provider";
import { UserAvatar } from "@/components/user-avatar";

type ChatItem = { id: string; title: string };

export function Sidebar({
  open,
  onClose,
  chats,
  onNewChat,
  className,
}: {
  open: boolean;
  onClose: () => void;
  chats: ChatItem[];
  onNewChat: () => void;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c") ?? "default";
  const [user, setUser] = React.useState(() => getStoredUser());
  const { sessions, refreshSessions } = useChatSessions();
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) void refreshSessions();
  }, [open, refreshSessions]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-dvh w-[85vw] sm:w-72 lg:w-80 max-w-[95vw] border-r border-zinc-300/50 dark:border-zinc-700/60 bg-background transition-transform duration-200 ease-in-out flex flex-col overflow-y-hidden overflow-x-hidden",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Section 1: Header with toggle */}
        <div className="-mx-4 -mt-4 bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Akili</span>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Section 2: Actions (fixed) */}
        <div className="-mx-4 bg-background/95 px-4 py-3 backdrop-blur"> 
          <div className="flex gap-2">
            <Button
              onClick={onNewChat}
              className="w-full transition-colors bg-black text-white hover:bg-black/90 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              New Chat
            </Button>
          </div>
        </div>

        {/* Section 3: Chats (scrollable) */}
        <nav className="space-y-1 flex-1 overflow-y-auto pt-3"> 
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chats</p>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chats yet</p>
          ) : (
            sessions.map((c) => {
              const isActive = c.id === activeId;
              return (
                <Link
                  key={c.id}
                  href={`/chat?c=${c.id}`}
                  className={cn(
                    "block truncate rounded-md px-2 py-2 text-sm transition-colors",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    isActive && "bg-zinc-200 dark:bg-zinc-700"
                  )}
                >
                  {c.title}
                </Link>
              );
            })
          )}
        </nav>

        {/* Section 4: Sticky profile */}
        <ProfileFooter userName={user?.name} userEmail={user?.email} />
      </aside>
    </>
  );
}


function ProfileFooter({ userName, userEmail }: { userName?: string | null; userEmail?: string | null }) {
  if (!userName) return null;
  return (
    <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur">
      <Link href="/profile" className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
        <UserAvatar name={userName} size={28} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{userName}</div>
          <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
        </div>
      </Link>
    </div>
  );
}


