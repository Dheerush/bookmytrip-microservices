import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { fail } from "../utils/response";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json(fail("Unauthorized: Missing bearer token", req.requestId));
    return;
  }

  const token = authorization.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (typeof decoded === "string") {
      res.status(401).json(fail("Unauthorized: Invalid token payload", req.requestId));
      return;
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json(fail("Unauthorized: Invalid or expired token", req.requestId));
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role || !roles.includes(role)) {
      res.status(403).json(fail("Forbidden: You do not have access to this resource", req.requestId));
      return;
    }

    next();
  };
};
