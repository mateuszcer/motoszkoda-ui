# Anti-Abuse Signup Hardening — Frontend Guide

## What changed

Three anti-abuse measures were added to the signup flow:

1. **Disposable email blocking** — signups with throwaway email providers (guerrillamail, mailinator, tempmail, etc.) are rejected with 422
2. **Stricter signup rate limiting** — 5 signups per IP per hour (in addition to existing 10 req/min on all auth endpoints)
3. **Cloudflare Turnstile CAPTCHA** — signup requests now accept an optional `captchaToken` field, forwarded to Supabase for verification

## Request body change

Signup endpoints (`POST /api/auth/users/signup`, `POST /api/auth/shops/signup`) now accept:

```json
{
  "email": "user@example.com",
  "password": "StrongPass1!",
  "captchaToken": "0x4AAAA..."
}
```

`captchaToken` is optional (nullable). When CAPTCHA is enabled in Supabase (staging/prod), a valid token is required or signup will fail.

## Turnstile integration

Install:

```bash
npm install @marsidev/react-turnstile
```

Usage:

```tsx
import { Turnstile } from '@marsidev/react-turnstile';

function SignupForm() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  return (
    <form onSubmit={handleSignup}>
      {/* email + password fields */}
      {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
        <Turnstile
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          onSuccess={(token) => setCaptchaToken(token)}
        />
      )}
      <button type="submit">Sign up</button>
    </form>
  );
}
```

The widget is conditionally rendered — if `VITE_TURNSTILE_SITE_KEY` is not set (local dev), it doesn't appear and `captchaToken` stays `null`.

## New error responses

| Status | Code                          | When                                         | Suggested UX                                              |
|--------|-------------------------------|----------------------------------------------|-----------------------------------------------------------|
| 422    | `DISPOSABLE_EMAIL_NOT_ALLOWED`| Throwaway email provider used                | "Please use a permanent email address"                    |
| 429    | `RATE_LIMITED`                | Too many signups or auth requests from same IP| "Too many attempts. Try again in X seconds" (use `Retry-After` header) |

Both return the standard `ErrorResponse`:

```json
{
  "code": "DISPOSABLE_EMAIL_NOT_ALLOWED",
  "message": "Disposable email addresses are not allowed",
  "details": [],
  "correlationId": "..."
}
```

## Local development

The backend uses `StubAuthProvider` locally, which ignores `captchaToken` entirely. Signup works with or without it. Don't set `VITE_TURNSTILE_SITE_KEY` locally — the widget won't render and everything works as before.

Disposable email blocking and rate limiting work locally as normal.
