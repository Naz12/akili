"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStoredUser } from "@/lib/auth";
import { UserAvatar } from "@/components/user-avatar";
 
 
export function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] = React.useState(() => null as ReturnType<typeof getStoredUser>);
  React.useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);
  const isLoggedIn = mounted && !!user;
  const brandHref = isLoggedIn ? "/chat" : "/";
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-2 px-4">
        <div className="flex items-center gap-2">
          {/* Mobile: open/close sidebar drawer */}
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          {/* Desktop: collapse/expand sidebar */}
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="hidden md:inline-flex">
            <PanelLeftClose className="h-5 w-5" />
            <span className="sr-only">Collapse sidebar</span>
          </Button>
          <Link href={brandHref} className="flex items-center gap-2 font-semibold">
            <Image
              src="/logo 1.jpg"
              alt="Akili"
              width={28}
              height={28}
              className="block dark:hidden rounded"
              priority
            />
            <Image
              src="/logo 2.jpg"
              alt="Akili"
              width={28}
              height={28}
              className="hidden dark:block rounded"
              priority
            />
            <span className="sr-only">Akili</span>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!mounted ? null : (
            !isLoggedIn ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild className="transition-colors bg-black text-white hover:bg-black/90 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <UserAvatar name={user?.name} size={22} />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>
                </Button>
              </>
            )
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}


