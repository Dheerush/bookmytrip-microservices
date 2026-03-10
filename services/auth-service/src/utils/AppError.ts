// export class AppError extends Error {
//   statusCode: number;
//   isOperational: boolean;

//   constructor(message: string, statusCode = 500) {
//     super(message);
//     this.statusCode = statusCode;
//     this.isOperational = true;
//   }
// }

// utils/AppError.ts
// Extended to carry a machine-readable `code` and optional `data` payload
// so the frontend can branch on specific error cases (e.g. EMAIL_UNVERIFIED)

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code:       string;
  public readonly data?:      Record<string, unknown>;
  public readonly isOperational = true;

  constructor(
    message:    string,
    statusCode: number          = 500,
    code:       string          = 'INTERNAL_ERROR',
    data?:      Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
    this.data       = data;
    Error.captureStackTrace(this, this.constructor);
  }
}