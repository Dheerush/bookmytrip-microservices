import { AUTH_API_BASE } from '@/lib/api-config';

export const ENDPOINTS = {
  login: `${AUTH_API_BASE}/login`,
  register: `${AUTH_API_BASE}/register`,
  forgotPassword: `${AUTH_API_BASE}/forgot-password`,
  verifyOtp: `${AUTH_API_BASE}/verify-otp`,
  resendOtp: `${AUTH_API_BASE}/resend-otp`,
  requestVerification: `${AUTH_API_BASE}/request-verification`,
};