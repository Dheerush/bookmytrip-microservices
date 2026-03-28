import { getAccessToken } from "@/lib/auth-session";

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  code?: string;
}

interface ParsedResponse<T> {
  ok: boolean;
  status: number;
  payload: ApiEnvelope<T> | null;
  fallbackMessage: string;
}

export function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<ParsedResponse<T>> {
  const contentType = response.headers.get("content-type") || "";
  let payload: ApiEnvelope<T> | null = null;

  if (contentType.includes("application/json")) {
    try {
      payload = (await response.json()) as ApiEnvelope<T>;
    } catch {
      payload = null;
    }
  } else {
    // Drain body to avoid unhandled stream while still presenting friendly errors.
    await response.text().catch(() => undefined);
  }

  if (!response.ok && (response.status === 401 || response.status === 403)) {
    // Helps quickly debug auth edge-cases without relying only on toast errors.
    console.warn("[auth] request failed", {
      status: response.status,
      url: response.url,
      message: payload?.message || fallbackMessage,
      code: payload?.code,
    });
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,
    fallbackMessage,
  };
}

export function getApiErrorMessage<T>(parsed: ParsedResponse<T>): string {
  if (parsed.payload?.message) return parsed.payload.message;

  if (parsed.status === 401) return "Please sign in again to continue.";
  if (parsed.status === 403) return "You do not have access to perform this action.";
  if (parsed.status === 404) return "Requested service is unavailable right now. Please try again.";
  if (parsed.status >= 500) return "Service is temporarily unavailable. Please retry in a few moments.";

  return parsed.fallbackMessage;
}
