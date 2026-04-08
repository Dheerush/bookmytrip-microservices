import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/services/auth/context';
import { showToast } from '@/lib/toast';
import { getApiErrorMessage, getAuthHeaders, parseApiResponse } from '@/lib/http';

interface RazorpayWindow extends Window {
  Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
}

const loadRazorpay = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as RazorpayWindow).Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface BookingFlowParams {
  itemId: string;
  type: 'flight' | 'hotel' | 'train' | 'cab' | 'tour';
  title: string;
  city?: string;
  fromCode?: string;
  toCode?: string;
  startDate: string;
  endDate?: string;
  scheduleTime?: string;
  quantity: number;
  amount: number;
  couponCode?: string;
  discountAmount?: number;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  passengers?: Array<{
    name: string;
    age?: number;
    gender?: string;
  }>;
}

export function useBookingFlow() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const processBookingAndPayment = useCallback(
    async (
      params: BookingFlowParams,
      netAmount: number,
      options?: {
        /** Called in place of the default redirect on successful payment. */
        onSuccess?: (bookingRef: string) => void;
        /** Called in place of the default redirect when payment is cancelled. */
        onCancel?: (bookingRef: string) => void;
      },
    ) => {
      if (!isAuthenticated) {
        showToast.error('Please sign in to complete your booking');
        router.push('/login');
        return;
      }

      try {
        const normalizedPhone = (params.contact.phone || '').replace(/\D/g, '');
        const safeContact = {
          name: params.contact.name?.trim() || 'Guest User',
          email: params.contact.email?.trim() || 'guest@bookmytrip.app',
          phone: normalizedPhone.length >= 8 ? normalizedPhone : '9999999999',
        };

        showToast.loading('Creating your booking...');

        // 1. Create booking
        const bookingRes = await fetch('/api/bookings', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            type: params.type,
            itemId: params.itemId,
            title: params.title,
            city: params.city,
            fromCode: params.fromCode,
            toCode: params.toCode,
            startDate: params.startDate,
            endDate: params.endDate,
            scheduleTime: params.scheduleTime,
            quantity: params.quantity,
            amount: Math.round(netAmount),
            contact: safeContact,
            passengers: params.passengers || [],
            metadata: {
              couponCode: params.couponCode,
              discountAmount: params.discountAmount,
            },
          }),
        });

        const parsedBooking = await parseApiResponse<{ _id: string; bookingRef: string }>(
          bookingRes,
          'Unable to create booking right now. Please try again.',
        );

        if (!parsedBooking.ok || !parsedBooking.payload?.data?._id) {
          throw new Error(getApiErrorMessage(parsedBooking));
        }

        const bookingData = parsedBooking.payload.data;
        const bookingId = bookingData._id;
        const bookingRef = bookingData.bookingRef;

        showToast.loading('Preparing payment...');

        // 2. Create payment record
        const paymentRes = await fetch('/api/payments', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            bookingId,
            amount: Math.round(netAmount),
            currency: 'INR',
            method: 'card',
            provider: 'razorpay',
            couponCode: params.couponCode,
            discountAmount: Math.round(params.discountAmount || 0),
          }),
        });

        const parsedPayment = await parseApiResponse<{ _id: string; paymentRef: string; status: string }>(
          paymentRes,
          'Payment processing failed. Please try again.',
        );

        if (!parsedPayment.ok || !parsedPayment.payload?.data) {
          throw new Error(getApiErrorMessage(parsedPayment));
        }

        const { paymentRef } = parsedPayment.payload.data;
        showToast.dismiss();

        // 3. Load Razorpay SDK and show checkout modal
        const sdkReady = await loadRazorpay();
        if (!sdkReady) {
          await fetch(`/api/bookings/${bookingId}/fail`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
          }).catch(() => undefined);
          showToast.error('Payment window could not load. Booking has been marked as failed.');
          if (options?.onCancel) {
            options.onCancel(bookingRef);
          } else {
            router.push(`/dashboard/bookings?error=${bookingRef}`);
          }
          return;
        }

        const win = window as RazorpayWindow;
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        // Demo / placeholder key — show in-app payment simulator
        if (!razorpayKey || !razorpayKey.startsWith('rzp_') || razorpayKey === 'rzp_test_placeholder') {
          showToast.loading('Opening payment…');
          // Simulate a brief processing delay for realism
          await new Promise((r) => setTimeout(r, 800));
          showToast.dismiss();

          const confirmed = window.confirm(
            `💳  BookMyTrip — Payment (Demo Mode)\n\n` +
            `Booking: ${params.title}\n` +
            `Amount:  ₹${netAmount.toLocaleString('en-IN')}\n\n` +
            `Press OK to simulate a successful payment.\n` +
            `Press Cancel to simulate a failed / abandoned payment.\n\n` +
            `(To use real Razorpay, set NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local)`
          );

          if (confirmed) {
            await fetch(`/api/bookings/${bookingId}/confirm`, {
              method: 'PATCH',
              headers: getAuthHeaders(),
            }).catch(() => undefined);
            if (params.couponCode && (params.discountAmount || 0) > 0) {
              await fetch('/api/admin/coupons/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ code: params.couponCode, bookingRef }),
              }).catch(() => undefined);
            }
            showToast.success('Payment successful! Booking confirmed.');
            if (options?.onSuccess) {
              options.onSuccess(bookingRef);
            } else {
              router.push(`/dashboard/bookings?success=${bookingRef}`);
            }
          } else {
            await fetch(`/api/bookings/${bookingId}/fail`, {
              method: 'PATCH',
              headers: getAuthHeaders(),
            }).catch(() => undefined);
            showToast.error('Payment was cancelled.');
            if (options?.onCancel) {
              options.onCancel(bookingRef);
            } else {
              router.push(`/dashboard/bookings?error=${bookingRef}`);
            }
          }
          return;
        }

        if (!win.Razorpay) {
          await fetch(`/api/bookings/${bookingId}/fail`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
          }).catch(() => undefined);
          showToast.error('Payment window could not load. Booking has been marked as failed.');
          if (options?.onCancel) {
            options.onCancel(bookingRef);
          } else {
            router.push(`/dashboard/bookings?error=${bookingRef}`);
          }
          return;
        }

        const checkout = new win.Razorpay!({
          key: razorpayKey,
          amount: Math.round(netAmount) * 100, // paise
          currency: 'INR',
          name: 'BookMyTrip',
          description: params.title,
          handler: async () => {
            await fetch(`/api/bookings/${bookingId}/confirm`, {
              method: 'PATCH',
              headers: getAuthHeaders(),
            }).catch(() => undefined);
            if (params.couponCode && (params.discountAmount || 0) > 0) {
              void fetch('/api/admin/coupons/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ code: params.couponCode, bookingRef }),
              }).catch(() => undefined);
            }
            showToast.success('Payment successful! Booking confirmed.');
            if (options?.onSuccess) {
              options.onSuccess(bookingRef);
            } else {
              router.push(`/dashboard/bookings?success=${bookingRef}`);
            }
          },
          modal: {
            ondismiss: async () => {
              await fetch(`/api/bookings/${bookingId}/fail`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
              }).catch(() => undefined);
              showToast.error('Payment was cancelled.');
              if (options?.onCancel) {
                options.onCancel(bookingRef);
              } else {
                router.push(`/dashboard/bookings?error=${bookingRef}`);
              }
            },
          },
          prefill: {
            name: safeContact.name,
            email: safeContact.email,
            contact: safeContact.phone,
          },
          notes: {
            bookingId,
            bookingRef,
            paymentRef,
          },
          theme: {
            color: '#6366f1',
          },
        });

        checkout.open();
      } catch (error) {
        showToast.dismiss();
        const message = error instanceof Error ? error.message : 'An error occurred';
        showToast.error(message);
        console.error('Booking flow error:', error);
      }
    },
    [router, isAuthenticated],
  );

  return { processBookingAndPayment };
}

