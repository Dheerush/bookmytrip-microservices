import { useGetFlightById, useCreateFlight, useUpdateFlight, useDeleteFlight } from './queries';

/**
 * Hook for fetching a single flight by ID
 */
export const useFlightDetails = (flightId: string | null) => {
  const { data, loading, error } = useGetFlightById(flightId || '');

  return {
    flight: data?.flightById || null,
    loading,
    error,
  };
};

/**
 * Hook for creating a flight (admin only)
 */
export const useCreateFlightMutation = () => {
  const { createFlight, loading, error, data } = useCreateFlight();

  return {
    createFlight,
    loading,
    error,
    data: data?.createFlight || null,
  };
};

/**
 * Hook for updating a flight (admin only)
 */
export const useUpdateFlightMutation = () => {
  const { updateFlight, loading, error, data } = useUpdateFlight();

  return {
    updateFlight,
    loading,
    error,
    data: data?.updateFlight || null,
  };
};

/**
 * Hook for deleting a flight (admin only)
 */
export const useDeleteFlightMutation = () => {
  const { deleteFlight, loading, error, data } = useDeleteFlight();

  return {
    deleteFlight,
    loading,
    error,
    message: data?.deleteFlight || null,
  };
};
