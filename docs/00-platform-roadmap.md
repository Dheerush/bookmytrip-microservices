# Platform Roadmap (Implementation Order)

## Goal

Build services in a sequence that keeps the system testable end-to-end at every step.

## Phase 1: Foundation (current)

- Platform architecture and service boundaries
- API contract standard (response envelope, errors, pagination, idempotency)
- Security baseline (JWT, rate limits, CORS, request validation)
- Event contracts and naming conventions
- Postman test approach

## Phase 2: API Gateway (current)

- Central entry point for all APIs
- Correlation ID propagation
- Request logging and standardized errors
- JWT authentication and route-level authorization
- Multi-layer rate limiting
- Downstream timeout, retries, and circuit breaker
- Health/readiness endpoints
- Swagger endpoint for gateway APIs

## Phase 3: Core Identity Domain

- User service (profile/travelers/preferences/sessions)

## Phase 4: Catalog Domain

- Flight, train, hotel, cab, package/tour services
- Seeded internal data source first, external provider adapters later

## Phase 5: Search Domain

- Unified search API across catalog services

## Phase 6: Transaction Domain

- Booking service with hold/confirm/cancel flow and idempotency keys

## Phase 7: Payment Domain

- Razorpay test integration (order create, callback/webhook verification)

## Phase 8+: Supporting Domains

- Notification, review, media, chat, AI, admin

## Delivery Rule

Each phase must include:

- OpenAPI update
- Health/readiness endpoints
- Postman collection updates
- Failure-path tests (auth, rate limit, validation, timeout)
