import axios from 'axios';
import { ENDPOINTS } from './api';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from './types';

export const login = (data: LoginRequest) =>
  axios.post<LoginResponse>(ENDPOINTS.login, data);

export const register = (data: RegisterRequest) =>
  axios.post<RegisterResponse>(ENDPOINTS.register, data);

export const forgotPassword = (data: ForgotPasswordRequest) =>
  axios.post<ForgotPasswordResponse>(ENDPOINTS.forgotPassword, data);

export const verifyOtp = (data: VerifyOtpRequest) =>
  axios.post<VerifyOtpResponse>(ENDPOINTS.verifyOtp, data);

export const requestVerification = (email: string) =>
  axios.post(ENDPOINTS.requestVerification, { email });