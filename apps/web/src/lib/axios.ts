import axios from 'axios';
import { GATEWAY_API_BASE } from './api-config';
import { getAccessToken, refreshAccessToken, touchSessionActivity } from './auth-session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || GATEWAY_API_BASE;

/**
 * Pre-configured Axios instance for all API calls.
 * - Centralized base URL
 * - JSON headers by default
 * - Interceptors for auth token injection & error normalization
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send cookies (refreshToken, csrfToken)
  timeout: 15_000,
});

let refreshInFlight: Promise<string | null> | null = null;

const getRefreshPromise = () => {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

// ── Request interceptor: attach access token ───────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: normalize errors ─────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    touchSessionActivity();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const shouldRetry =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      typeof window !== 'undefined';

    if (shouldRetry) {
      originalRequest._retry = true;
      const refreshedToken = await getRefreshPromise();

      if (refreshedToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
        return apiClient(originalRequest);
      }
    }

    // Extract backend error message if available
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    const code = error.response?.data?.code || undefined;
    const status = error.response?.status || 500;
    const data = error.response?.data?.data || undefined;

    return Promise.reject({ message, code, status, data });
  },
);

export default apiClient;
