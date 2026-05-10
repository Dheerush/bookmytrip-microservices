import { useState, useCallback } from 'react';
import { authService } from '@/services/auth';
import { showToast } from '@/lib/toast';

interface UseForgotPasswordReturn {
  handleForgotPassword: (email: string) => Promise<boolean>;
  loading: boolean;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const result = await authService.forgotPassword({ email });
      showToast.success(result.message || 'If that email exists, a reset link has been sent.');
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast.error(error.message || 'Something went wrong.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { handleForgotPassword, loading };
}
