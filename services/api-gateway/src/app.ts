import express, { Express, Request as ExpressRequest } from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import logger from "./config/logger";
import { swaggerSpec } from "./config/swagger";
import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { requestTimeoutMiddleware } from "./middleware/resilience.middleware";
import { securityMiddlewares } from "./middleware/security.middleware";
import gatewayRoutes from "./routes/gateway.routes";
import healthRoutes from "./routes/health.routes";

export const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestIdMiddleware);
  app.use(requestTimeoutMiddleware);

  securityMiddlewares.forEach((middleware) => app.use(middleware));

  morgan.token("requestId", (req) => {
    const request = req as ExpressRequest;
    return request.requestId || "-";
  });
  app.use(
    morgan(
      ":method :url :status :response-time ms requestId=:requestId",
      {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      },
    ),
  );

  app.use(healthRoutes);
  app.use(gatewayRoutes);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
