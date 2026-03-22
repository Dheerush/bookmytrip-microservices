# Postman Test Strategy

## Collections

Create one parent collection: `BookmyTrip API v1`

Sub-folders:

1. Gateway Health And Docs
2. Auth
3. User
4. Catalog (Flights/Trains/Hotels/Cabs/Packages)
5. Booking
6. Payment (Razorpay test)
7. Notifications

## Environments

- `local` with `baseUrl`, token placeholders, service ports
- `staging` with deployment hostnames

## Mandatory Test Cases Per Endpoint

- Happy path
- Unauthorized access
- Forbidden role
- Validation failure
- Rate-limited request
- Service unavailable/fallback behavior

## Gateway-Specific Cases

- Correlation ID present in response headers
- Request blocked by auth policy where required
- Public routes available without token
- Consistent error envelope for downstream failures

## Payment-Specific Cases

- Order creation with idempotency key
- Duplicate request with same key (same result)
- Webhook signature verification success/failure
- Duplicate webhook event handling

## Exit Criteria Before Moving To Next Service

- 100% critical endpoint pass in Postman smoke set
- No open P1 issues
- OpenAPI spec updated and committed
