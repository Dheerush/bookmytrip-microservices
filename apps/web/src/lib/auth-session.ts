import { AUTH_ENDPOINTS } from '@/services/auth/endpoints';

const ACCESS_TOKEN_KEY = 'accessToken';
const LAST_ACTIVITY_KEY = 'lastActivityAt';

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const touchSessionActivity = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
};

export const getLastSessionActivity = (): number => {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  return raw ? Number(raw) : 0;
};

export const clearSessionActivity = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LAST_ACTIVITY_KEY);
};

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const getCsrfToken = (): string | null => getCookieValue('csrfToken');

export const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const csrfToken = getCsrfToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken;
  }

  const response = await fetch(AUTH_ENDPOINTS.refresh, {
    method: 'POST',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    console.warn('[auth] refresh token request failed', { status: response.status });
    return null;
  }
  const payload = (await response.json().catch(() => null)) as { data?: { accessToken?: string } } | null;
  const token = payload?.data?.accessToken;
  if (!token) return null;

  setAccessToken(token);
  touchSessionActivity();
  return token;
};