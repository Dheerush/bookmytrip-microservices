# Architecture And Service Boundaries

## Entry Pattern

Client -> API Gateway -> Domain Service -> Database/Cache

## Communication Pattern

- Synchronous HTTP for user-facing read/write operations
- Asynchronous events (RabbitMQ) for side effects and eventual consistency

## Service Boundaries

- `auth-service`: authentication, token lifecycle, account verification
- `user-service`: profile domain, travelers, preferences, session metadata
- `catalog services`: flights/hotels/trains/cabs/packages inventory and pricing snapshots
- `booking-service`: booking lifecycle (draft/hold/confirm/cancel)
- `payment-service`: payment order lifecycle and provider integration
- `notification-service`: email/sms/push orchestration

## Data Ownership Rule

Each service owns its own schema and persistence models.
No direct database access across services.

## Request Context Rule

Gateway must attach and propagate:

- `x-correlation-id` for traceability
- `x-user-id` and `x-user-role` for authenticated requests

## Error Ownership Rule

- Services return domain-specific errors
- Gateway normalizes the outer error envelope for clients

## Backward Compatibility Rule

- Public API versioning via `/api/v1`
- Breaking changes require a new versioned path
