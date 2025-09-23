"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { listPlans, createCheckoutSession, type Plan, type PlansResponse } from "@/lib/billing";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";

export default function PricingPage() {
  const router = useRouter();
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
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load plans");
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
    } catch (e: any) {
      setError(e?.message || "Failed to start checkout");
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
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
            <div>Loading...</div>
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


