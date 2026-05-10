import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import type { LoginRequest } from '@/services/auth';
import { useAuth } from '@/services/auth/context';
import { showToast } from '@/lib/toast';

interface UseLoginReturn {
  handleLogin: (data: LoginRequest) => Promise<void>;
  loading: boolean;
}

/**
 * Handles login flow including unverified-email redirect.
 * On success: stores accessToken + user in auth context, redirects to home.
 * On EMAIL_UNVERIFIED: stores session, redirects to /otp.
 */
export function useLogin(): UseLoginReturn {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();

  const handleLogin = useCallback(async (data: LoginRequest) => {
    setLoading(true);
    try {
      const result = await authService.login(data);

      // Update auth context (sets React state + persists to sessionStorage)
      setAuth(result.data);

      showToast.success('Login successful!');
      router.replace('/');
    } catch (err: unknown) {
      const error = err as { code?: string; data?: { sessionToken?: string }; message?: string };
      // Backend sends sessionToken when user is unverified
      if (error.code === 'EMAIL_UNVERIFIED' && error.data?.sessionToken) {
        sessionStorage.setItem('otp_session_token', error.data.sessionToken);
        sessionStorage.setItem('otp_email_display', data.email);
        showToast.info('Please verify your email first. OTP sent.');
        router.push(`/otp?sessionToken=${encodeURIComponent(error.data.sessionToken)}`);
        return;
      }
      showToast.error(error.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }, [router, setAuth]);

  return { handleLogin, loading };
}
