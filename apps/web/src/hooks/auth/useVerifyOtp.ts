import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import type { VerifyOtpRequest } from '@/services/auth';
import { showToast } from '@/lib/toast';

interface UseVerifyOtpReturn {
  handleVerify: (data: VerifyOtpRequest) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useVerifyOtp(): UseVerifyOtpReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleVerify = useCallback(async (data: VerifyOtpRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.verifyOtp(data);
      showToast.success(result.message || 'Email verified successfully!');
      setTimeout(() => router.replace('/login'), 900);
      return true;
    } catch (err: any) {
      const msg = err.message || 'Verification failed.';
      setError(msg);
      showToast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { handleVerify, loading, error };
}
