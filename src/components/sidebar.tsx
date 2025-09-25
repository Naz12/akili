"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Plus, Search, BookOpen, Folder, LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredUser, logout } from "@/lib/auth";
import { renameSession } from "@/lib/chat";
import { useChatSessions } from "@/components/chat-sessions-provider";
import { UserAvatar } from "@/components/user-avatar";

export function Sidebar({
  open,
  onClose,
  onNewChat,
  className,
}: {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c") ?? "default";
  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] =
    React.useState<ReturnType<typeof getStoredUser>>(null);
  const { sessions, loading, refreshSessions, upsertSession } =
    useChatSessions();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState<string>("");

  React.useEffect(() => {
    if (open) void refreshSessions();
  }, [open, refreshSessions]);

  React.useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  const filteredSessions = sessions;

  return (
    <>
      {/* Mobile overlay */}
      {mounted && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "z-40 flex flex-col bg-zinc-950 text-zinc-100",
          "transform transition-transform duration-300 ease-in-out",
          // mobile
          "fixed top-14 bottom-0 left-0 w-[85vw] max-w-[95vw] md:hidden", // <-- starts at top-14
          open ? "translate-x-0" : "-translate-x-full",
          // desktop
          "hidden md:flex md:fixed md:top-14 md:bottom-0 md:left-0 md:w-64", // <-- also top-14
          className
        )}
      >
        {/* New chat (top) */}
        <div className="p-3 border-b border-zinc-800">
          <Button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full justify-start gap-2 rounded-md bg-primary text-black font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Pinned actions */}
        <div className="p-2 border-b border-zinc-800 space-y-1">
          <SidebarLink
            href="#"
            icon={<Search className="h-4 w-4" />}
            label="Search chats"
          />
          <SidebarLink
            href="#"
            icon={<BookOpen className="h-4 w-4" />}
            label="Library"
          />
        </div>

        {/* Sessions */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 custom-scrollbar space-y-1">
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <p className="text-sm text-zinc-400">No chats yet</p>
          ) : (
            filteredSessions.map((c) => {
              const isActive = c.id === activeId;
              return (
                <Link
                  key={c.id}
                  href={`/chat?c=${c.id}`}
                  className={cn(
                    "flex items-center gap-2 truncate rounded-md px-3 py-2 text-sm",
                    "hover:bg-zinc-800",
                    isActive && "bg-zinc-800 text-white font-medium"
                  )}
                >
                  <Folder className="h-4 w-4 text-zinc-400" />
                  {editingId === c.id ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const next = editingTitle.trim();
                        if (!next || next === c.title) {
                          setEditingId(null);
                          return;
                        }
                        const res = await renameSession(c.id, next);
                        upsertSession({ id: res.id, title: res.title });
                        setEditingId(null);
                      }}
                    >
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        autoFocus
                        className="h-7 text-xs"
                      />
                    </form>
                  ) : (
                    <span className="truncate">{c.title}</span>
                  )}
                </Link>
              );
            })
          )}
        </nav>

        {/* Persistent new chat + footer */}
        <div className="border-t border-zinc-800 p-3">
          <Button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            variant="outline"
            className="w-full justify-center gap-2 rounded-md border-zinc-700 text-zinc-200 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ProfileFooter
          userName={mounted ? user?.name : undefined}
          userEmail={mounted ? user?.email : undefined}
        />
      </aside>
    </>
  );
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-800"
    >
      {icon}
      {label}
    </Link>
  );
}

function ProfileFooter({
  userName,
  userEmail,
}: {
  userName?: string | null;
  userEmail?: string | null;
}) {
  if (!userName) return null;
  return (
    <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-950">
      <div className="flex items-center justify-between">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-800"
        >
          <UserAvatar name={userName} size={28} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{userName}</div>
            <div className="truncate text-xs text-zinc-400">{userEmail}</div>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          className="text-zinc-400 hover:text-red-600"
          onClick={() => {
            logout();
            window.location.href = "/auth/login";
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
