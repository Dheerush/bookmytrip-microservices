export const apiResponse = <T>(data: T, message = 'Success') => ({
  success: true,
  message,
  data,
});