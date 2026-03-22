# Security Baseline

## HTTP Security

- Use `helmet` with CSP tuned for your frontend domains
- Disable `x-powered-by`
- Request payload limit (`1mb` default)

## CORS Policy

- Use explicit allowlist from environment variable
- Allow credentials only for trusted frontend origins
- Deny wildcard origin in non-local environments

## AuthN/AuthZ

- JWT access token must be verified at gateway for protected routes
- Role-based route authorization at gateway edge
- Service-level authorization for domain-specific ownership checks

## Rate Limiting

Apply two layers:

1. IP-based global limiter
2. User-based authenticated limiter

Algorithm recommendation:

- Token bucket / sliding window for burst + sustained control

## Input Safety

- Validate all request inputs (params/query/body)
- Reject malformed payloads with `422`
- Sanitize known unsafe fields and enforce max lengths

## Secrets

- Store secrets in environment variables only
- Never log secret values
- Rotate JWT secrets and provider keys periodically

## Logging And Audit

- Structured logs (JSON in production)
- Include `correlationId`, `userId`, path, method, status, latency
- Audit log authentication and payment-sensitive actions

## Session Expiration

- Keep access token TTL short
- Prefer refresh token rotation with revocation support
