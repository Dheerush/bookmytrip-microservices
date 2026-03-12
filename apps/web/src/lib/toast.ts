import toast from 'react-hot-toast';

/**
 * Centralized toast helpers.
 * Usage:
 *   import { showToast } from '@/lib/toast';
 *   showToast.success('Logged in!');
 *   showToast.error('Invalid credentials');
 */
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) =>
    toast(message, {
      icon: 'ℹ️',
      style: {
        border: '1px solid #bfdbfe',
        background: '#eff6ff',
        color: '#1e40af',
      },
    }),
  loading: (message: string) => toast.loading(message),
  dismiss: (id?: string) => (id ? toast.dismiss(id) : toast.dismiss()),
};

export default toast;
