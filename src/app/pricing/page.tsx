"use client";

import * as React from "react";
import { listPlans, createCheckoutSession, type Plan, type PlansResponse } from "@/lib/billing";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PricingPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [currency, setCurrency] = React.useState<string>("USD");
  const [loading, setLoading] = React.useState(true);
  const [checkingOut, setCheckingOut] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data: PlansResponse = await listPlans();
        if (mounted) {
          setPlans(data.plans);
          setCurrency(data.currency || "USD");
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load plans";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSelectPlan = async (planId: string) => {
    setError(null);
    setCheckingOut(planId);
    try {
      const { url } = await createCheckoutSession({
        plan_id: planId,
        success_url: typeof window !== "undefined" ? window.location.origin + "/chat" : undefined,
        cancel_url: typeof window !== "undefined" ? window.location.href : undefined,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to start checkout";
      setError(message);
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <main className="container mx-auto flex-1 p-6">
        <section className="mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Choose a plan</h1>
            <p className="text-muted-foreground mt-1">Upgrade to unlock more features and usage.</p>
          </div>
          {error && (
            <div className="mb-4 text-sm text-red-600">{error}</div>
          )}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex flex-col">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <div className="mt-2 flex items-baseline gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p) => (
                <Card key={p.id} className="flex flex-col">
                    <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-semibold">
                        {new Intl.NumberFormat(undefined, { style: "currency", currency: (p.currency || currency).toUpperCase() }).format(p.monthly_price)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="text-muted-foreground">• {p.description || "Great features"}</li>
                      <li className="text-muted-foreground">• Daily messages: {p.daily_message_limit}</li>
                      <li className="text-muted-foreground">• Max tokens: {p.max_tokens}</li>
                      {p.engine && (
                        <li className="text-muted-foreground">• Model: {p.engine.name} ({p.engine.provider})</li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" disabled={checkingOut === String(p.id)} onClick={() => onSelectPlan(String(p.id))}>
                      {checkingOut === p.id ? "Redirecting..." : "Get started"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


