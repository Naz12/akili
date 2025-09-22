"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStoredUser, logout } from "@/lib/auth";
import { UserAvatar } from "@/components/user-avatar";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = React.useState(() => getStoredUser());
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
            </div>
            <div className="pt-2">
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


