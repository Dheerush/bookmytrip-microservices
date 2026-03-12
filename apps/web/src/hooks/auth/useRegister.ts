import { useState, useCallback } from 'react';
import { authService } from '@/services/auth';
import type { RegisterRequest, ApiResponse, RegisterData } from '@/services/auth';
import { showToast } from '@/lib/toast';

interface UseRegisterReturn {
  handleRegister: (data: RegisterRequest) => Promise<ApiResponse<RegisterData> | null>;
  loading: boolean;
}

export function useRegister(): UseRegisterReturn {
  const [loading, setLoading] = useState(false);

  const handleRegister = useCallback(async (data: RegisterRequest) => {
    setLoading(true);
    try {
      const result = await authService.register(data);
      showToast.success(result.message || 'Registration successful! Please verify OTP.');
      return result;
    } catch (err: any) {
      showToast.error(err.message || 'Registration failed.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { handleRegister, loading };
}
