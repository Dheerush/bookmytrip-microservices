import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/services/auth/context';
import { showToast } from '@/lib/toast';
import { getApiErrorMessage, getAuthHeaders, parseApiResponse } from '@/lib/http';

interface BookingFlowParams {
  itemId: string;
  type: 'flight' | 'hotel' | 'train' | 'cab';
  title: string;
  city?: string;
  fromCode?: string;
  toCode?: string;
  startDate: string;
  endDate?: string;
  quantity: number;
  amount: number;
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
    async (params: BookingFlowParams, netAmount: number) => {
      if (!isAuthenticated) {
        showToast.error('Please sign in to complete your booking');
        router.push('/login');
        return;
      }

      try {
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
            quantity: params.quantity,
            amount: params.amount,
            contact: params.contact,
            passengers: params.passengers || [],
            metadata: {},
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

        showToast.loading('Processing payment...');

        // 2. Process payment
        const paymentRes = await fetch('/api/payments', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            bookingId,
            amount: netAmount,
            currency: 'INR',
            method: 'card',
          }),
        });

        const parsedPayment = await parseApiResponse<{ status: string; bookingRef?: string }>(
          paymentRes,
          'Payment processing failed. Please try again.',
        );

        if (!parsedPayment.ok || !parsedPayment.payload?.data) {
          throw new Error(getApiErrorMessage(parsedPayment));
        }

        const paymentData = parsedPayment.payload.data;
        const paymentStatus = paymentData.status;

        showToast.dismiss();

        if (paymentStatus === 'succeeded') {
          showToast.success('Booking and payment completed!');
          // Redirect to booking history or confirmation page
          router.push(`/dashboard/bookings?success=${bookingData.bookingRef}`);
        } else {
          showToast.error('Payment failed. Please try again.');
          // Could redirect to retry or keep user on current page
          router.push(`/dashboard/bookings?error=${paymentData.bookingRef}`);
        }
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
