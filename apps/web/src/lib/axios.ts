import axios from 'axios';
import { GATEWAY_API_BASE } from './api-config';

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

// ── Request interceptor: attach access token ───────────────────────────
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: normalize errors ─────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
