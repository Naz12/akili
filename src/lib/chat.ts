import { apiFetch, getStoredUser } from "./api-client";

export interface ChatMessagePayload {
  message: string;
  session_id?: string;
  attachment_url?: string;
}

export interface ChatMessageResponse {
  session_id: string;
  message: {
    role: "assistant" | "user";
    content: string;
  };
}

export async function sendChatMessage(payload: ChatMessagePayload): Promise<ChatMessageResponse> {
  const user = getStoredUser();
  const region = user?.region || "local";
  return apiFetch<ChatMessageResponse, ChatMessagePayload>(`/${region}/chat`, {
    method: "POST",
    body: payload,
  });
}

export interface UploadResponse {
  url: string;
  filename: string;
  extension: string;
  mime: string;
  size_kb: number;
  uploaded_at: string;
}

export async function uploadAttachment(file: File): Promise<UploadResponse> {
  const user = getStoredUser();
  const region = user?.region || "local";
  const form = new FormData();
  form.append("file", file);
  return apiFetch<UploadResponse, FormData>(`/${region}/chat/upload`, {
    method: "POST",
    body: form,
    rawBody: true,
    headers: {},
  });
}

// History APIs
export interface ChatSessionSummary {
  id: string;
  title: string;
  created_at: string;
  messages?: Array<{ id: string | number; role: "user" | "assistant"; content: string; created_at: string }>;
}

export async function listChatSessions(opts?: { with_messages?: boolean }): Promise<ChatSessionSummary[]> {
  const user = getStoredUser();
  const region = user?.region || "local";
  const query = opts?.with_messages ? "?with_messages=true" : "";
  return apiFetch<ChatSessionSummary[]>(`/${region}/chat/sessions${query}`, { method: "GET" });
}

export interface ChatSessionMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function getSessionMessages(sessionId: string): Promise<ChatSessionMessage[]> {
  const user = getStoredUser();
  const region = user?.region || "local";
  return apiFetch<ChatSessionMessage[]>(`/${region}/chat/messages/${sessionId}`, { method: "GET" });
}

export async function renameSession(sessionId: string, title: string): Promise<{ id: string; title: string; updated_at: string }> {
  const user = getStoredUser();
  const region = user?.region || "local";
  return apiFetch<{ id: string; title: string; updated_at: string }, { title: string }>(`/${region}/chat/sessions/${sessionId}`, {
    method: "PUT",
    body: { title },
  });
}

export async function deleteSession(sessionId: string): Promise<{ message: string }> {
  const user = getStoredUser();
  const region = user?.region || "local";
  return apiFetch<{ message: string }>(`/${region}/chat/sessions/${sessionId}`, { method: "DELETE" });
}


