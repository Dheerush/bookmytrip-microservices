export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Record<string, unknown>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    sessionToken?: string;
    code?: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

// ✅ Fixed: sessionToken not email — backend identifies user via session
export interface VerifyOtpRequest {
  sessionToken: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface ResendOtpRequest {
  sessionToken: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
  data?: {
    sessionToken?: string;
  };
}

export interface RequestVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    sessionToken?: string;
  };
}