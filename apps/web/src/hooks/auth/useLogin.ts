import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import type { LoginRequest } from '@/services/auth';
import { showToast } from '@/lib/toast';

interface UseLoginReturn {
  handleLogin: (data: LoginRequest) => Promise<void>;
  loading: boolean;
}

/**
 * Handles login flow including unverified-email redirect.
 * On success: stores accessToken, redirects to home.
 * On EMAIL_UNVERIFIED: stores session, redirects to /otp.
 */
export function useLogin(): UseLoginReturn {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = useCallback(async (data: LoginRequest) => {
    setLoading(true);
    try {
      const result = await authService.login(data);

      // Store access token for subsequent API calls
      sessionStorage.setItem('accessToken', result.data.accessToken);

      showToast.success('Login successful!');
      router.replace('/');
    } catch (err: any) {
      // Backend sends sessionToken when user is unverified
      if (err.code === 'EMAIL_UNVERIFIED' && err.data?.sessionToken) {
        sessionStorage.setItem('otp_session_token', err.data.sessionToken);
        sessionStorage.setItem('otp_email_display', data.email);
        showToast.info('Please verify your email first. OTP sent.');
        router.push(`/otp?sessionToken=${encodeURIComponent(err.data.sessionToken)}`);
        return;
      }
      showToast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { handleLogin, loading };
}
