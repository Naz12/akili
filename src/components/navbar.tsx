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
  const [user, setUser] =
    React.useState<ReturnType<typeof getStoredUser>>(null);

  React.useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  const isLoggedIn = mounted && !!user;
  const brandHref = isLoggedIn ? "/chat" : "/";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="container mx-auto flex h-14 items-center gap-2 px-4">
        {/* Left Section: Sidebar + Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile: toggle sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          {/* Desktop: collapse sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden md:inline-flex"
          >
            <PanelLeftClose className="h-5 w-5" />
            <span className="sr-only">Collapse sidebar</span>
          </Button>

          {/* Brand logo */}
          <Link
            href={brandHref}
            className="flex items-center gap-2 font-semibold text-primary hover:text-primary-gold transition-colors"
          >
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

        {/* Right Section: Auth + Theme */}
        <div className="ml-auto flex items-center gap-2">
          {!mounted ? null : !isLoggedIn ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button
                asChild
                className="bg-primary-gold text-black font-medium hover:bg-primary-gold/90"
              >
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          ) : (
            <Button variant="ghost" asChild>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 py-1"
              >
                <UserAvatar name={user?.name} size={22} />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
