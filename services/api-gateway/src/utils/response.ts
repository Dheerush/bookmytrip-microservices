export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  requestId?: string;
}

export const ok = <T>(message: string, data: T, requestId?: string): ApiEnvelope<T> => ({
  success: true,
  message,
  data,
  requestId,
});

export const fail = (message: string, requestId?: string): ApiEnvelope<null> => ({
  success: false,
  message,
  data: null,
  requestId,
});
