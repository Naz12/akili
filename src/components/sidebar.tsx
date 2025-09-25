"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { X, MoreVertical, Share2, Pencil, Trash } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import { deleteSession, renameSession, listChatSessions } from "@/lib/chat";
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
  const [user, setUser] = React.useState<ReturnType<typeof getStoredUser>>(null);
  const { sessions, loading, refreshSessions, upsertSession } = useChatSessions();
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
      if (e.key === "Escape") setOpenMenuId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) void refreshSessions();
  }, [open, refreshSessions]);

  React.useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  return (
    <>
      {/* Mobile overlay (render after mount to avoid SSR/CSR mismatch) */}
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
          // shared
          "z-50 flex flex-col overflow-y-hidden overflow-x-hidden border-r border-zinc-300/50 dark:border-zinc-700/60 bg-background transition-all duration-200 ease-in-out",
          // mobile: overlay slide in/out
          "fixed inset-y-0 left-0 w-[85vw] max-w-[95vw] md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
          // desktop: push layout with width transition
          "hidden md:flex md:relative md:inset-auto md:h-auto",
          open ? "md:w-72 lg:w-80" : "md:w-0",
          className
        )}
      >
        {/* Section 1: Header with toggle */}
        <div className="-mx-4 -mt-4 bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:mt-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Akili</span>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar" className="md:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Section 2: Actions (fixed) */}
        <div className="-mx-4 bg-background/95 px-4 py-3 backdrop-blur md:mx-0">
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
          {loading ? (
            <div className="space-y-1 px-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chats yet</p>
          ) : (
            sessions.map((c) => {
              const isActive = c.id === activeId;
              return (
                <div key={c.id} className="relative">
                  <div
                    className={cn(
                      "flex items-center justify-between gap-2 truncate rounded-md px-2 py-2 text-sm transition-colors",
                      "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      isActive && "bg-zinc-200 dark:bg-zinc-700"
                    )}
                  >
                    {editingId === c.id ? (
                      <form
                        className="min-w-0 flex-1"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const next = editingTitle.trim();
                          if (!next || next === c.title) {
                            setEditingId(null);
                            return;
                          }
                          setIsSaving(true);
                          try {
                            const res = await renameSession(c.id, next);
                            upsertSession({ id: res.id, title: res.title });
                          } finally {
                            setIsSaving(false);
                            setEditingId(null);
                          }
                        }}
                      >
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={async () => {
                            if (isSaving) return;
                            const next = editingTitle.trim();
                            if (!next || next === c.title) {
                              setEditingId(null);
                              return;
                            }
                            setIsSaving(true);
                            try {
                              const res = await renameSession(c.id, next);
                              upsertSession({ id: res.id, title: res.title });
                            } finally {
                              setIsSaving(false);
                              setEditingId(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.preventDefault();
                              setEditingId(null);
                            }
                          }}
                          autoFocus
                          className="h-8"
                        />
                      </form>
                    ) : (
                      <Link
                        href={`/chat?c=${c.id}`}
                        className="min-w-0 flex-1 truncate"
                        onClick={() => setOpenMenuId(null)}
                      >
                        {c.title}
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="More options"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === c.id ? null : c.id));
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  {openMenuId === c.id ? (
                    <div className="absolute right-2 top-10 z-50 w-40 rounded-md border bg-background p-1 shadow-md">
                      <button
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            const url = `${window.location.origin}/chat?c=${c.id}`;
                            if (navigator.share) {
                              await navigator.share({ title: c.title || "Chat", url });
                            } else if (navigator.clipboard?.writeText) {
                              await navigator.clipboard.writeText(url);
                              setCopiedId(c.id);
                              setTimeout(() => setCopiedId((prev) => (prev === c.id ? null : prev)), 1500);
                            }
                          } finally {
                            setOpenMenuId(null);
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        <span>{copiedId === c.id ? "Link copied" : "Share"}</span>
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingId(c.id);
                          setEditingTitle(c.title || "");
                          setOpenMenuId(null);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Rename</span>
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!window.confirm("Delete this chat? This cannot be undone.")) {
                            setOpenMenuId(null);
                            return;
                          }
                          try {
                            await deleteSession(c.id);
                            const after = await listChatSessions({ with_messages: false });
                            if (c.id === activeId) {
                              if (after.length > 0) {
                                try {
                                  router.replace(`/chat?c=${after[0].id}`);
                                } catch {}
                              } else {
                                try {
                                  router.replace("/chat");
                                } catch {}
                              }
                            }
                            await refreshSessions();
                          } finally {
                            setOpenMenuId(null);
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </nav>

        {/* Section 4: Sticky profile */}
        <ProfileFooter userName={mounted ? user?.name : undefined} userEmail={mounted ? user?.email : undefined} />
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


