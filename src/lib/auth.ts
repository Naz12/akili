import { apiFetch, saveTokens, setStoredUser, clearTokens, type User } from "./api-client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  region: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user?: User;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse, LoginPayload>("/login", { method: "POST", body: payload, auth: false });
  saveTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
  if (res.user) setStoredUser(res.user);
  return res;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse, SignupPayload>("/register", { method: "POST", body: payload, auth: false });
  saveTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
  if (res.user) setStoredUser(res.user);
  return res;
}

export async function getMe<TUser = unknown>(): Promise<TUser> {
  return apiFetch<TUser>("/me", { method: "GET" });
}

export async function logout(): Promise<{ message: string } | string> {
  try {
    const result = await apiFetch<{ message: string } | string>("/logout", { method: "POST" });
    clearTokens();
    return result;
  } catch {
    // Fallback: some deployments use /auth/logout
    try {
      const alt = await apiFetch<{ message: string } | string>("/auth/logout", { method: "POST" });
      clearTokens();
      return alt;
    } catch {
      // Even if API fails, clear local session to complete client logout
      clearTokens();
      return { message: "Logged out locally" };
    }
  }
}

export async function refresh(): Promise<{ access_token: string; refresh_token?: string }> {
  const res = await apiFetch<{ access_token: string; refresh_token?: string }>(
    "/refresh-token",
    { method: "POST", body: { refresh_token: null }, auth: false }
  );
  // Note: refresh flow is handled in api-client via refreshAccessToken; this is a manual trigger placeholder
  return res;
}

export async function loginWithGoogle(payload: { id_token: string; region: string }): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse, { id_token: string; region: string }>(
    "/login/google",
    { method: "POST", body: payload, auth: false }
  );
  saveTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
  if (res.user) setStoredUser(res.user);
  return res;
}

export async function sendResetCode(payload: { email: string }): Promise<{ message: string }> {
  return apiFetch<{ message: string }, { email: string }>("/send-reset-code", { method: "POST", body: payload, auth: false });
}

export async function resetPasswordWithCode(payload: {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }, typeof payload>("/reset-password-code", { method: "POST", body: payload, auth: false });
}

export { getStoredUser } from "./api-client";


