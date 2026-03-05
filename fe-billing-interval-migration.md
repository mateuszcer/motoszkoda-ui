# Frontend Migration: Billing Interval on Enrollment Payment

## What changed

The `POST /api/enrollment/payment` endpoint now **requires a request body** with a `billingInterval` field. Previously it accepted no body.

## API change

### Before

```http
POST /api/enrollment/payment
Authorization: Bearer <token>
```

No request body.

### After

```http
POST /api/enrollment/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "billingInterval": "MONTHLY"
}
```

### `billingInterval` values

| Value     | Description          |
|-----------|----------------------|
| `MONTHLY` | Monthly billing cycle |
| `ANNUAL`  | Annual billing cycle  |

The field is **required** — omitting it returns a `400` validation error.

### Response

No changes. Still returns:

```json
{
  "subscriptionId": "sub_...",
  "clientSecret": "pi_..._secret_..."
}
```

## What FE needs to change

1. **Add `Content-Type: application/json` header** to the payment initiation request (if not already set).

2. **Send `{ "billingInterval": "MONTHLY" }` as the request body** in the existing flow. This makes the current monthly flow work exactly as before.

3. **When ready to support annual plans**: add a plan selection step (toggle/radio) before calling the endpoint, and pass the user's choice (`MONTHLY` or `ANNUAL`) in the body.

## Environment variables

Backend now uses two separate Stripe price IDs instead of one:

| Old env var                    | New env vars                          |
|-------------------------------|---------------------------------------|
| `STRIPE_ENROLLMENT_PRICE_ID` | `STRIPE_ENROLLMENT_MONTHLY_PRICE_ID`  |
|                               | `STRIPE_ENROLLMENT_ANNUAL_PRICE_ID`   |

No FE action needed — this is backend/infra only. Mentioned for awareness.
