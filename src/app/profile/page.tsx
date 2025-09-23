"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStoredUser, logout } from "@/lib/auth";
import { UserAvatar } from "@/components/user-avatar";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { getSubscription, type Subscription } from "@/lib/billing";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = React.useState(() => getStoredUser());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = React.useState(true);
  const [subError, setSubError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const data = await getSubscription();
        if (mounted) setSubscription(data);
      } catch (e: any) {
        if (mounted) setSubError(e?.message || "");
      } finally {
        if (mounted) setSubLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      await logout();
      router.push("/auth/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-dvh w-full flex-col">
        <Navbar />
        <main className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">You are not logged in.</p>
              <Button className="mt-4" onClick={() => router.push("/auth/login")}>Log in</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <Navbar />
      <main className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} size={40} />
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Region" value={user.region ?? "—"} />
              <Info label="Role" value={user.role ?? "user"} />
              <Info label="Verified" value={user.email_verified_at ? "Yes" : "No"} />
              <Info label="Created" value={user.created_at ?? "—"} />
              <Info
                label="Current Plan"
                value={subLoading ? "Loading..." : subscription ? subscription.plan?.name : "None"}
              />
              <Info
                label="Plan Status"
                value={subLoading ? "Loading..." : subscription ? (subscription.is_active ? "active" : subscription.is_expired ? "expired" : "inactive") : "—"}
              />
            </div>
            {subError && (
              <div className="text-sm text-red-600">{subError}</div>
            )}
            <div className="pt-2 flex flex-wrap gap-2">
              <Button variant="secondary" asChild>
                <Link href="/pricing">Upgrade plan</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/billing">Billing</Link>
              </Button>
              <Button onClick={handleLogout} disabled={isSubmitting}>Log out</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}


