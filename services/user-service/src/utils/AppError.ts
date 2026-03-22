export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly data?: Record<string, unknown>;
  public readonly isOperational = true;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', data?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}
