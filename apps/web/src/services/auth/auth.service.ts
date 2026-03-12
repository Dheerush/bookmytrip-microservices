import apiClient from '@/lib/axios';
import { AUTH_ENDPOINTS } from './endpoints';
import type {
  RegisterRequest,
  LoginRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  RequestVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ApiResponse,
  RegisterData,
  LoginData,
  ResendOtpData,
  RequestVerificationData,
} from './auth.types';

/**
 * Auth service — thin wrappers over apiClient.
 * Each method returns `response.data` (the backend envelope) directly.
 * Error handling is done by hooks that call these.
 */
const authService = {
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<RegisterData>>(AUTH_ENDPOINTS.register, data)
      .then((r) => r.data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginData>>(AUTH_ENDPOINTS.login, data)
      .then((r) => r.data),

  verifyOtp: (data: VerifyOtpRequest) =>
    apiClient.post<ApiResponse>(AUTH_ENDPOINTS.verifyOtp, data)
      .then((r) => r.data),

  resendOtp: (data: ResendOtpRequest) =>
    apiClient.post<ApiResponse<ResendOtpData>>(AUTH_ENDPOINTS.resendOtp, data)
      .then((r) => r.data),

  requestVerification: (data: RequestVerificationRequest) =>
    apiClient.post<ApiResponse<RequestVerificationData>>(AUTH_ENDPOINTS.requestVerification, data)
      .then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<ApiResponse>(AUTH_ENDPOINTS.forgotPassword, data)
      .then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<ApiResponse>(AUTH_ENDPOINTS.resetPassword, data)
      .then((r) => r.data),

  logout: () =>
    apiClient.post<ApiResponse>(AUTH_ENDPOINTS.logout)
      .then((r) => r.data),
};

export default authService;
