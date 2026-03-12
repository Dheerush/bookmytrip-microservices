/**
 * Auth API endpoint paths.
 * Used by auth.service.ts — never import this directly in components.
 */
export const AUTH_ENDPOINTS = {
  register:            '/api/auth/register',
  login:               '/api/auth/login',
  verifyOtp:           '/api/auth/verify-otp',
  resendOtp:           '/api/auth/resend-otp',
  requestVerification: '/api/auth/request-verification',
  forgotPassword:      '/api/auth/forgot-password',
  resetPassword:       '/api/auth/reset-password',
  refresh:             '/api/auth/refresh',
  logout:              '/api/auth/logout',
} as const;
