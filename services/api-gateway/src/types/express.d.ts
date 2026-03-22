import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: JwtPayload & {
        sub?: string;
        id?: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export {};
