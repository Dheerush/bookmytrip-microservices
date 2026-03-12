// ── Request DTOs ──────────────────────────────────────────────────────────

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'user' | 'vendor';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  sessionToken: string;
  otp: string;
}

export interface ResendOtpRequest {
  sessionToken: string;
}

export interface RequestVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ── Response DTOs ─────────────────────────────────────────────────────────

/** Standard backend envelope */
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export interface RegisterData {
  sessionToken: string;
  code?: string; // 'EMAIL_UNVERIFIED' when re-sending for existing unverified account
}

export interface LoginData {
  user: {
    id: string;
    email: string;
    role: string;
  };
  accessToken: string;
}

export interface ResendOtpData {
  sessionToken: string;
}

export interface RequestVerificationData {
  sessionToken?: string;
}
