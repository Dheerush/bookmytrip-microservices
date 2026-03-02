export const apiResponse = (data: any, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};