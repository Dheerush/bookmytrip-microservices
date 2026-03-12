import { useState, useCallback } from 'react';
import { authService } from '@/services/auth';
import { showToast } from '@/lib/toast';

interface UseRequestVerificationReturn {
  handleRequestVerification: (email: string) => Promise<string | null>;
  loading: boolean;
}

/**
 * For users who registered but never verified and session has expired.
 * Returns new sessionToken (null if account doesn't exist / already verified).
 */
export function useRequestVerification(): UseRequestVerificationReturn {
  const [loading, setLoading] = useState(false);

  const handleRequestVerification = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const result = await authService.requestVerification({ email });
      showToast.success(result.message || 'If an unverified account exists, an OTP has been sent.');
      return result.data?.sessionToken ?? null;
    } catch (err: any) {
      showToast.error(err.message || 'Something went wrong.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { handleRequestVerification, loading };
}
