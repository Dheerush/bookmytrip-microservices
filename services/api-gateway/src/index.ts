import { createApp } from "./app";
import { env } from "./config/env";
import logger from "./config/logger";

const bootstrap = async (): Promise<void> => {
  try {
    const app = await createApp();

    const server = app.listen(env.PORT, () => {
      logger.info("API Gateway started", {
        port: env.PORT,
        environment: env.NODE_ENV,
        health: `http://localhost:${env.PORT}/health`,
        docs: `http://localhost:${env.PORT}/docs`,
        graphql: `http://localhost:${env.PORT}/graphql`,
      });
    });

    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down API Gateway gracefully.`);
      server.close(() => {
        logger.info("API Gateway shutdown complete");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    logger.error("Failed to start API Gateway", { error });
    process.exit(1);
  }
};

bootstrap();
