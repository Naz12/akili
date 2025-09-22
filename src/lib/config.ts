export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://app.etsystems.co/api/v1";

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}



