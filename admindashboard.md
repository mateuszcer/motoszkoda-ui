# Admin Dashboard — Frontend Implementation Plan

## Overview

Minimal admin dashboard with two features: dedicated admin login and voucher code generation.

---

## API Specs Reference

All referenced operations are documented in the backend OpenAPI specs:

| Feature         | Spec file                            | Operation ID     |
|-----------------|--------------------------------------|------------------|
| Admin sign-in   | `docs/openapi/auth-openapi.yml`       | `adminSignin`    |
| Create voucher  | `docs/openapi/enrollment-openapi.yml` | `createVoucher`  |

---

## Pages & Routes

| Route             | Page              | Auth required |
|-------------------|-------------------|---------------|
| `/admin/login`    | Admin Login       | No            |
| `/admin/vouchers` | Voucher Generator | Yes (ADMIN)   |

---

## Page 1: Admin Login (`/admin/login`)

### API call

```
POST /api/auth/admin/signin
```

**Spec:** `auth-openapi.yml` > `adminSignin`

**Request schema:** `AuthRequest` — `{ email, password, captchaToken? }`

**Success schema:** `SigninResult` — `{ userId, email, role, accessToken, refreshToken, expiresIn }`

### UI

- Email + password form
- CAPTCHA widget (Cloudflare Turnstile), same as other login pages
- Submit button
- Error display area

### Behavior

1. On submit, call `adminSignin` with email, password, and captchaToken
2. On `200` — store `accessToken` and `refreshToken`, redirect to `/admin/vouchers`
3. Error handling:
   - `401` / `INVALID_CREDENTIALS` — "Invalid email or password"
   - `403` / `ROLE_MISMATCH` — "This account is not an admin"
   - `400` / `CAPTCHA_FAILED` — "CAPTCHA verification failed, please try again"
   - `429` / `RATE_LIMITED` — "Too many attempts, try again later"

### Notes

- Admin accounts have no signup flow — they are provisioned manually in the database
- This page should be visually distinct from user/shop login (e.g. different header, no signup link)
- Consider not making this page discoverable from the main app navigation

---

## Page 2: Voucher Generator (`/admin/vouchers`)

### API call

```
POST /api/admin/enrollment/vouchers
Authorization: Bearer <accessToken>
```

**Spec:** `enrollment-openapi.yml` > `createVoucher`

**Request schema:** `CreateVoucherRequest` — `{ code }`

**Success schema:** `VoucherResponse` — `{ id, code }`

### UI

- Text input for voucher code
- "Generate" / "Create Voucher" button
- Success area: shows the created voucher code (copyable)
- Error display area
- Optional: list of recently created vouchers in current session (client-side only, no list endpoint yet)

### Validation (client-side, before API call)

- Code: 6–30 characters, alphanumeric only (`^[a-zA-Z0-9]{6,30}$`)
- Show inline validation error if pattern doesn't match

### Behavior

1. Validate code format client-side
2. Call `createVoucher` with `{ code }` and `Authorization: Bearer <token>`
3. On `201` — show success message with the created code, clear the input
4. Error handling:
   - `400` — "Invalid code format" (shouldn't happen if client validates, but handle anyway)
   - `409` — "This voucher code already exists, choose a different one"
   - `401` — token expired, redirect to `/admin/login`
   - `403` — not an admin, redirect to `/admin/login`

### Notes

- No backend endpoint to list vouchers exists yet — if needed, that's a separate backend task
- Consider adding a "Generate random code" button that fills the input with a random alphanumeric string (e.g. 12 chars)

---

## Auth & Token Management

- Store tokens in memory or secure storage (not localStorage for accessToken)
- Attach `Authorization: Bearer <accessToken>` header to all admin API calls
- On `401` from any admin endpoint, clear tokens and redirect to `/admin/login`
- Token refresh is not implemented on the backend yet — for now, re-login on expiry

---

## Not in scope (future)

- Shop suspend/unsuspend (`suspendShop` / `unsuspendShop` in `enrollment-openapi.yml`)
- Voucher listing/search
- User management
- Token refresh flow
