import axios from "axios";
import { Request, Response, Router } from "express";
import { listConfiguredServices } from "../config/services";
import { ok } from "../utils/response";

const router: Router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json(ok("API Gateway is healthy", {
    service: "api-gateway",
    timestamp: new Date().toISOString(),
  }));
});

router.get("/ready", async (_req: Request, res: Response) => {
  const results = await Promise.allSettled(
    listConfiguredServices().map(async (service) => {
      const target = service.targets[0];
      const response = await axios.get(`${target}/health`, { timeout: 1200 });
      return {
        service: service.service,
        target,
        statusCode: response.status,
      };
    }),
  );

  const checks = results.map((result, index) => {
    const current = listConfiguredServices()[index];

    if (result.status === "fulfilled") {
      return {
        service: current.service,
        ready: true,
        details: result.value,
      };
    }

    return {
      service: current.service,
      ready: false,
      details: (result.reason as Error).message,
    };
  });

  const allReady = checks.every((check) => check.ready);
  const statusCode = allReady ? 200 : 503;

  res.status(statusCode).json(ok("Gateway readiness check", {
    ready: allReady,
    checks,
  }));
});

export default router;
