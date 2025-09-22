"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  size = 28,
  className,
}: {
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = React.useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase() || name[0]?.toUpperCase() || "?";
  }, [name]);

  const sizePx = `${size}px`;

  return (
    <div
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 text-xs font-medium",
        className
      )}
      style={{ width: sizePx, height: sizePx }}
      aria-label={name || "User"}
    >
      {initials}
    </div>
  );
}


