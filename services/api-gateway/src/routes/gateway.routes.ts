import { IncomingMessage } from "http";
import { NextFunction, Request, Response, Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { env } from "../config/env";
import { getServiceTarget, ServiceName } from "../config/services";
import { authenticate } from "../middleware/auth.middleware";
import { apiRateLimiter, authRateLimiter } from "../middleware/rateLimit.middleware";
import { CircuitBreakerManager } from "../utils/circuitBreaker";
import { fail } from "../utils/response";

const router: Router = Router();

const circuitBreaker = new CircuitBreakerManager({
  failureThreshold: env.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  resetTimeoutMs: env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS,
});

const guardCircuit = (serviceName: ServiceName) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!circuitBreaker.canRequest(serviceName)) {
      res.status(503).json(fail(`Service temporarily unavailable: ${serviceName}`, req.requestId));
      return;
    }

    next();
  };
};

const buildProxy = (serviceName: ServiceName) => {
  return createProxyMiddleware({
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: env.REQUEST_TIMEOUT_MS,
    timeout: env.REQUEST_TIMEOUT_MS,
    router: () => getServiceTarget(serviceName),
    on: {
      proxyReq: (proxyReq, req: IncomingMessage) => {
        const request = req as Request;
        if (request.requestId) {
          proxyReq.setHeader("x-request-id", request.requestId);
        }

        const userId = request.user?.sub || request.user?.id;
        if (userId) {
          proxyReq.setHeader("x-user-id", userId);
        }

        if (request.user?.email) {
          proxyReq.setHeader("x-user-email", request.user.email);
        }

        if (request.user?.role) {
          proxyReq.setHeader("x-user-role", request.user.role);
        }
      },
      proxyRes: (proxyRes) => {
        if (proxyRes.statusCode && proxyRes.statusCode >= 500) {
          circuitBreaker.recordFailure(serviceName);
          return;
        }

        circuitBreaker.recordSuccess(serviceName);
      },
      error: (_err, req, res) => {
        circuitBreaker.recordFailure(serviceName);

        const response = res as Response;
        if (response.headersSent) {
          return;
        }

        response.status(502).json(fail(`Bad gateway for service: ${serviceName}`, (req as Request).requestId));
      },
    },
  });
};

router.get("/gateway/circuit-breakers", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Circuit breaker status",
    data: circuitBreaker.snapshot(),
  });
});

router.use("/api/auth", authRateLimiter, guardCircuit("auth"), buildProxy("auth"));

router.use("/api/users", apiRateLimiter, authenticate, guardCircuit("user"), buildProxy("user"));
router.use("/api/flights", apiRateLimiter, guardCircuit("flight"), buildProxy("flight"));
router.use("/api/trains", apiRateLimiter, guardCircuit("train"), buildProxy("train"));
router.use("/api/hotels", apiRateLimiter, guardCircuit("hotel"), buildProxy("hotel"));
router.use("/api/cabs", apiRateLimiter, guardCircuit("cab"), buildProxy("cab"));
router.use("/api/bookings", apiRateLimiter, authenticate, guardCircuit("booking"), buildProxy("booking"));
router.use("/api/payments", apiRateLimiter, authenticate, guardCircuit("payment"), buildProxy("payment"));
router.use("/api/search", apiRateLimiter, guardCircuit("search"), buildProxy("search"));
router.use("/api/media", apiRateLimiter, guardCircuit("media"), buildProxy("media"));
router.use("/api/reviews", apiRateLimiter, guardCircuit("review"), buildProxy("review"));
router.use("/api/tours", apiRateLimiter, guardCircuit("tour"), buildProxy("tour"));
router.use("/api/ai", apiRateLimiter, guardCircuit("ai"), buildProxy("ai"));
router.use("/api/admin", apiRateLimiter, guardCircuit("admin"), buildProxy("admin"));

export default router;
