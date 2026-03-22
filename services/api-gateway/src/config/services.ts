import { env } from "./env";

export type ServiceName = "auth" | "user" | "flight" | "train" | "hotel" | "cab" | "booking" | "payment" | "search" | "media" | "review" | "tour" | "ai" | "admin";

interface ServiceDefinition {
  name: ServiceName;
  targets: string[];
}

const parseTargets = (value: string): string[] =>
  value
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);

const definitions: Record<ServiceName, ServiceDefinition> = {
  auth: {
    name: "auth",
    targets: parseTargets(env.AUTH_SERVICE_URL),
  },
  user: {
    name: "user",
    targets: parseTargets(env.USER_SERVICE_URL),
  },
  flight: {
    name: "flight",
    targets: parseTargets(env.FLIGHT_SERVICE_URL),
  },
  train: {
    name: "train",
    targets: parseTargets(env.TRAIN_SERVICE_URL),
  },
  hotel: {
    name: "hotel",
    targets: parseTargets(env.HOTEL_SERVICE_URL),
  },
  cab: {
    name: "cab",
    targets: parseTargets(env.CAB_SERVICE_URL),
  },
  booking: {
    name: "booking",
    targets: parseTargets(env.BOOKING_SERVICE_URL),
  },
  payment: {
    name: "payment",
    targets: parseTargets(env.PAYMENT_SERVICE_URL),
  },
  search: {
    name: "search",
    targets: parseTargets(env.SEARCH_SERVICE_URL),
  },
  media: {
    name: "media",
    targets: parseTargets(env.MEDIA_SERVICE_URL),
  },
  review: {
    name: "review",
    targets: parseTargets(env.REVIEW_SERVICE_URL),
  },
  tour: {
    name: "tour",
    targets: parseTargets(env.TOUR_SERVICE_URL),
  },
  ai: {
    name: "ai",
    targets: parseTargets(env.AI_SERVICE_URL),
  },
  admin: {
    name: "admin",
    targets: parseTargets(env.ADMIN_SERVICE_URL),
  },
};

const roundRobinCursor = new Map<ServiceName, number>();

export const getServiceTarget = (serviceName: ServiceName): string => {
  const service = definitions[serviceName];
  if (!service || service.targets.length === 0) {
    throw new Error(`No upstream target configured for service: ${serviceName}`);
  }

  const current = roundRobinCursor.get(serviceName) ?? 0;
  const target = service.targets[current % service.targets.length];
  roundRobinCursor.set(serviceName, (current + 1) % service.targets.length);

  return target;
};

export const listConfiguredServices = (): Array<{ service: ServiceName; targets: string[] }> =>
  Object.values(definitions).map((entry) => ({
    service: entry.name,
    targets: [...entry.targets],
  }));
