export const AUTH_API_BASE = 'http://localhost:5001/api/auth';

export const ENDPOINTS = {
  login: `${AUTH_API_BASE}/login`,
  register: `${AUTH_API_BASE}/register`,
  forgotPassword: `${AUTH_API_BASE}/forgot-password`,
  verifyOtp: `${AUTH_API_BASE}/verify-otp`,
  resendOtp: `${AUTH_API_BASE}/resend-otp`,
  requestVerification: `${AUTH_API_BASE}/request-verification`,
};