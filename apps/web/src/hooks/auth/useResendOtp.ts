import { useState, useCallback } from 'react';
import { authService } from '@/services/auth';
import { showToast } from '@/lib/toast';

interface UseResendOtpReturn {
  handleResend: (sessionToken: string) => Promise<string | null>;
  loading: boolean;
}

/**
 * Returns the NEW sessionToken from the backend on success (null on failure).
 */
export function useResendOtp(): UseResendOtpReturn {
  const [loading, setLoading] = useState(false);

  const handleResend = useCallback(async (sessionToken: string) => {
    setLoading(true);
    try {
      const result = await authService.resendOtp({ sessionToken });
      showToast.success('OTP resent successfully.');
      return result.data?.sessionToken ?? null;
    } catch (err: any) {
      showToast.error(err.message || 'Failed to resend OTP.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { handleResend, loading };
}
