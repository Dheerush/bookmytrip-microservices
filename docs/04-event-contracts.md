# Event Contracts

## Broker

RabbitMQ is the asynchronous event transport.

## Naming Convention

Use domain event names in past tense:

- `auth.user.registered.v1`
- `booking.created.v1`
- `booking.confirmed.v1`
- `payment.succeeded.v1`
- `notification.requested.v1`

## Message Envelope

```json
{
  "eventId": "<uuid>",
  "eventName": "booking.created.v1",
  "occurredAt": "2026-03-22T10:00:00.000Z",
  "correlationId": "<uuid>",
  "producer": "booking-service",
  "schemaVersion": 1,
  "payload": {}
}
```

## Delivery Rules

- Publisher must set persistent messages
- Consumer handlers must be idempotent
- Use dead-letter queue for poison messages
- Retry with bounded attempts and exponential backoff

## Versioning Rules

- Additive payload changes keep same major version
- Breaking payload changes must bump event version suffix (`.v2`)

## Traceability Rules

- Preserve and forward `correlationId`
- Log `eventId`, `eventName`, and processing duration
