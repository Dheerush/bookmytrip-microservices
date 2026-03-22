# API Standards

## Base Path Convention

All external endpoints should be exposed as `/api/v1/...`.

## Success Envelope

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {},
  "meta": {
    "correlationId": "<uuid>",
    "timestamp": "2026-03-22T10:00:00.000Z"
  }
}
```

## Error Envelope

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  },
  "meta": {
    "correlationId": "<uuid>",
    "timestamp": "2026-03-22T10:00:00.000Z"
  }
}
```

## Common Error Codes

- `VALIDATION_ERROR` (422)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `RATE_LIMITED` (429)
- `UPSTREAM_UNAVAILABLE` (503)
- `INTERNAL_ERROR` (500)

## Pagination Standard

Request query:

- `page` (default `1`)
- `limit` (default `20`, max `100`)
- `sortBy`
- `sortOrder` (`asc` | `desc`)

Response `meta.pagination`:

```json
{
  "page": 1,
  "limit": 20,
  "total": 145,
  "totalPages": 8
}
```

## Idempotency Standard

Required for non-safe operations in booking/payment flows:

- Header: `x-idempotency-key`
- Scope: `user + endpoint + key`
- Key TTL recommendation: 24 hours

## Versioning Standard

- Additive changes only in the same version
- Breaking schema changes require next version path
