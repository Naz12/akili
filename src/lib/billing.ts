import { apiFetch, getStoredUser } from "./api-client";

export type Plan = {
  id: number | string;
  name: string;
  monthly_price: number;
  currency: string;
  region: string;
  max_tokens: number;
  daily_message_limit: number;
  ads_enabled: boolean;
  is_default: boolean;
  description: string;
  image_url?: string;
  tag?: string;
  trial_days: number;
  engine_id: number;
  badge?: string;
  engine?: {
    name: string;
    provider: string;
    max_tokens: number;
    price_per_1k: number;
    is_vision_support: boolean;
  };
};

export type PlansResponse = {
  region: "local" | "intl" | string;
  currency: string;
  plans: Plan[];
};

export type Subscription = {
  id: number | string;
  start_date: string;
  end_date: string;
  tokens_used: string | number;
  is_active: boolean;
  tokens_available: number;
  days_left: number;
  is_expired: boolean;
  plan: {
    name: string;
    monthly_price: string | number;
    max_tokens: string | number;
    daily_message_limit: string | number;
    ads_enabled: boolean;
  };
  engine: {
    name: string;
    provider: string;
    max_tokens: string | number;
    price_per_1k: string | number;
    is_vision_support: string | boolean;
  };
};

export async function listPlans(regionParam?: "local" | "intl" | string): Promise<PlansResponse> {
  const preferredRegion = (regionParam || getStoredUser()?.region || "local") as string;
  const tryRegions = Array.from(new Set([preferredRegion, "local", "intl"]));
  let lastErr: unknown = null;
  for (const region of tryRegions) {
    try {
      return await apiFetch<PlansResponse>(`/${region}/plans`, { method: "GET" });
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || "").toLowerCase();
      if (!msg.includes("invalid region")) {
        break;
      }
      // else fall through to next region
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Failed to load plans");
}

export async function createCheckoutSession(payload: {
  plan_id: string;
  success_url?: string;
  cancel_url?: string;
}): Promise<{ url: string }> {
  return apiFetch<{ url: string }, typeof payload>("/billing/checkout", {
    method: "POST",
    body: payload,
  });
}

export async function getSubscription(regionParam?: "local" | "intl" | string): Promise<Subscription | null> {
  const preferredRegion = (regionParam || getStoredUser()?.region || "local") as string;
  const tryRegions = Array.from(new Set([preferredRegion, "local", "intl"]));
  let lastErr: unknown = null;
  for (const region of tryRegions) {
    try {
      const res = await apiFetch<{ data: Subscription }>(`/${region}/subscription`, { method: "GET" });
      return res?.data ?? null;
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || "").toLowerCase();
      if (!msg.includes("invalid region")) {
        break;
      }
    }
  }
  if (String((lastErr as any)?.message || "").toLowerCase().includes("not found")) return null;
  throw lastErr instanceof Error ? lastErr : new Error("Failed to load subscription");
}

export async function openBillingPortal(payload?: {
  return_url?: string;
}): Promise<{ url: string }> {
  return apiFetch<{ url: string }, typeof payload>("/billing/portal", {
    method: "POST",
    body: payload || {},
  });
}


