"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSubscription, openBillingPortal, type Subscription } from "@/lib/billing";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { getStoredUser } from "@/lib/auth";

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = React.useState(false);

  React.useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const data = await getSubscription();
        if (mounted) setSubscription(data);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load subscription");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const onOpenPortal = async () => {
    setError(null);
    setOpeningPortal(true);
    try {
      const { url } = await openBillingPortal({
        return_url: typeof window !== "undefined" ? window.location.href : undefined,
      });
      if (url) window.location.href = url;
    } catch (e: any) {
      setError(e?.message || "Failed to open billing portal");
    } finally {
      setOpeningPortal(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 p-6">
        <section className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Billing</h1>
            <p className="text-muted-foreground mt-1">Manage your subscription and payment details.</p>
          </div>

          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

          {loading ? (
            <div>Loading...</div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Current plan</CardTitle>
                <CardDescription>
                  {subscription ? `${subscription.plan?.name} — ${subscription.is_active ? "active" : subscription.is_expired ? "expired" : "inactive"}` : "You do not have an active subscription."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="text-sm text-muted-foreground">
                    <p>Start: {new Date(subscription.start_date).toLocaleString()}</p>
                    <p>End: {new Date(subscription.end_date).toLocaleString()}</p>
                    <p>Tokens available: {subscription.tokens_available}</p>
                    <p>Daily message limit: {subscription.plan?.daily_message_limit}</p>
                    <p>Engine: {subscription.engine?.name} ({subscription.engine?.provider})</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No active plan. Visit the pricing page to subscribe.
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <Button onClick={() => router.push("/pricing")} variant="secondary">View pricing</Button>
                  <Button onClick={onOpenPortal} disabled={openingPortal}>
                    {openingPortal ? "Opening portal..." : "Manage billing"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}


