'use client';

import { Toaster } from 'react-hot-toast';

/**
 * Drop-in toast provider — add once in root layout.
 * All toasts fired via `toast` from lib/toast.ts will render here.
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'var(--font-jost), Jost, sans-serif',
          fontSize: '0.875rem',
          borderRadius: '8px',
          padding: '12px 18px',
          maxWidth: '420px',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#fff' },
          style: {
            border: '1px solid #d1fae5',
            background: '#f0fdf4',
            color: '#166534',
          },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
          style: {
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#991b1b',
          },
        },
      }}
    />
  );
}
