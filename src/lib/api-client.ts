import { buildApiUrl } from "./config";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  rawBody?: boolean;
  auth?: boolean;
  _isRetry?: boolean;
  credentials?: RequestCredentials;
}

function extractErrorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) {
    const m = (detail as { message?: string }).message;
    if (m) return m;
  }
  return fallback;
}

// Storage keys
const ACCESS_TOKEN_KEY = "akili_access_token";
const REFRESH_TOKEN_KEY = "akili_refresh_token";
const USER_KEY = "akili_user";

function isBrowser() {
  return typeof window !== "undefined";
}

// User model
export type User = {
  id: number | string;
  name: string;
  email: string;
  region?: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  role?: string;
  fcm_token?: string | null;
  country_id?: number | null;
  is_suspended?: string | number | boolean;
  password_reset_code?: string | null;
};

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let inMemoryUser: User | null = null;

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (isBrowser()) {
    const v = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    inMemoryAccessToken = v;
    return v;
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;
  if (isBrowser()) {
    const v = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    inMemoryRefreshToken = v;
    return v;
  }
  return null;
}

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (isBrowser()) {
    if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function setRefreshToken(token: string | null) {
  inMemoryRefreshToken = token;
  if (isBrowser()) {
    if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function saveTokens(tokens: { access_token?: string | null; refresh_token?: string | null }) {
  if (tokens.access_token !== undefined) setAccessToken(tokens.access_token || null);
  if (tokens.refresh_token !== undefined) setRefreshToken(tokens.refresh_token || null);
}

export function getStoredUser(): User | null {
  if (inMemoryUser) return inMemoryUser;
  if (isBrowser()) {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      inMemoryUser = JSON.parse(raw) as User;
      return inMemoryUser;
    } catch {
      window.localStorage.removeItem(USER_KEY);
    }
  }
  return null;
}

export function setStoredUser(user: User | null) {
  inMemoryUser = user;
  if (isBrowser()) {
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(USER_KEY);
  }
}

export function clearTokens() {
  setAccessToken(null);
  setRefreshToken(null);
  setStoredUser(null);
}

async function refreshAccessToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await apiFetch<{ access_token: string; refresh_token?: string }>(
      "/refresh-token",
      { method: "POST", body: { refresh_token: rt }, auth: false }
    );
    saveTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function apiFetch<TResponse = unknown, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", body, headers = {}, rawBody = false, auth = true, _isRetry = false } = options;

  const finalHeaders: Record<string, string> = {
    ...(rawBody ? {} : { "Content-Type": "application/json" }),
    ...headers,
  };

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: finalHeaders,
    credentials: options.credentials ?? "omit",
  };

  if (body !== undefined) {
    const bodyInit: BodyInit = rawBody ? (body as unknown as BodyInit) : JSON.stringify(body);
    (fetchOptions as RequestInit).body = bodyInit;
  }

  const res = await fetch(buildApiUrl(path), fetchOptions);
  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    if (auth && res.status === 401 && !_isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiFetch<TResponse, TBody>(path, { ...options, _isRetry: true });
      }
    }

    let errorDetail: unknown = undefined;
    try {
      errorDetail = contentType.includes("application/json") ? await res.json() : await res.text();
    } catch {
      // ignore
    }
    const message = extractErrorMessage(errorDetail, res.statusText);
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  if (contentType.includes("application/json")) {
    return (await res.json()) as TResponse;
  }
  return (await res.text()) as unknown as TResponse;
}


