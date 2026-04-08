import express, { Express, Request as ExpressRequest } from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema";
import { resolvers, GraphQLContext } from "./graphql/resolvers";
import logger from "./config/logger";
import { swaggerSpec } from "./config/swagger";
import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { requestTimeoutMiddleware } from "./middleware/resilience.middleware";
import { securityMiddlewares } from "./middleware/security.middleware";
import gatewayRoutes from "./routes/gateway.routes";
import healthRoutes from "./routes/health.routes";

export const createApp = async (): Promise<Express> => {
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

  // ── GraphQL Setup ──────────────────────────────────────────────────────────
  const apolloServer = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const request = req as ExpressRequest;
      return {
        req: request,
        user: (request as any).user,
        requestId: (request as any).requestId || "unknown",
      };
    },
    introspection: process.env.NODE_ENV === "development",
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app, path: "/graphql" });

  app.use(healthRoutes);
  app.use(gatewayRoutes);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
