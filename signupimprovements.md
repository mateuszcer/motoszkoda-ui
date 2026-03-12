# Email Confirmation — Frontend Implementation Scope

## Context

When a user signs up via `POST /api/auth/users/signup` or `POST /api/auth/shops/signup`,
Supabase sends a confirmation email. The email contains a verification link that:

1. Points to Supabase (`https://cemblmhsimigebfdmezm.supabase.co/auth/v1/verify?token=...&type=signup`)
2. Supabase verifies the token server-side (marks the email as confirmed in the DB)
3. Supabase redirects to the configured **Site URL** with session tokens in the URL fragment

**Current problem:** Site URL is `localhost:3000` — needs to be `https://www.autoceny.eu`.

---

## Supabase Dashboard Configuration (Backend/DevOps)

These changes must be made in the [Supabase Dashboard](https://supabase.com/dashboard/project/cemblmhsimigebfdmezm/auth/url-configuration):

| Setting | Current Value | New Value |
|---------|--------------|-----------|
| **Site URL** | `http://localhost:3000` | `https://www.autoceny.eu` |
| **Redirect URLs** | (none or localhost) | `https://www.autoceny.eu/**`, `https://autoceny.eu/**`, `http://localhost:3000/**` (for local dev) |

> Keep `http://localhost:3000/**` in Redirect URLs so local FE development still works.

---

## Redirect Flow After Confirmation

After the user clicks the confirmation link, Supabase redirects to:

```
https://www.autoceny.eu/#access_token=<jwt>&refresh_token=<token>&expires_in=3600&token_type=bearer&type=signup
```

The tokens are in the **URL fragment** (after `#`), not query parameters.
This means they are only accessible via client-side JavaScript, never sent to the server.

---

## Frontend Implementation Tasks

### 1. Auth Callback Route

Create a route that handles the Supabase redirect after email confirmation.

**Route:** `/auth/callback` (or `/auth/confirm` — pick one and stay consistent)

**Why a dedicated route:** The Supabase redirect lands on the Site URL root (`/`) by default, but
having a dedicated callback route is cleaner and avoids interference with the homepage.
To use a dedicated route, update the Supabase Site URL to `https://www.autoceny.eu/auth/callback`
OR pass `emailRedirectTo` option when calling signup from the frontend.

#### Option A: Using Supabase JS SDK (recommended)

If the frontend uses `@supabase/supabase-js`, the SDK handles token parsing automatically:

```typescript
// supabase.ts — Supabase client singleton
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://cemblmhsimigebfdmezm.supabase.co',
  '<anon-key>'
)
```

```typescript
// auth/callback page (e.g. /auth/callback)
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    // The Supabase SDK automatically detects the tokens in the URL fragment
    // and exchanges them for a session via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setStatus('success')
        // Store the access_token for API calls to the backend
        // session.access_token is the JWT to send as Bearer token
        // Redirect to main app after short delay
        setTimeout(() => {
          window.location.href = '/dashboard' // or wherever
        }, 2000)
      }
    })

    // Fallback: if no auth event fires within 5s, show error
    const timeout = setTimeout(() => {
      setStatus((prev) => prev === 'loading' ? 'error' : prev)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div>
      {status === 'loading' && <p>Potwierdzanie adresu email...</p>}
      {status === 'success' && <p>Email potwierdzony! Przekierowywanie...</p>}
      {status === 'error' && (
        <div>
          <p>Nie udalo się potwierdzić emaila.</p>
          <a href="/login">Przejdź do logowania</a>
        </div>
      )}
    </div>
  )
}
```

#### Option B: Manual token parsing (if NOT using Supabase JS SDK)

If the frontend calls the backend API directly without the Supabase SDK:

```typescript
// auth/callback page
export default function AuthCallback() {
  useEffect(() => {
    // Parse tokens from URL fragment
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type') // 'signup', 'recovery', 'magiclink'

    if (accessToken && type === 'signup') {
      // Email is confirmed. Two choices:
      //
      // Choice 1: Auto-sign-in using the token from the fragment.
      // Store the token and use it for API calls immediately.
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
      window.location.href = '/dashboard'
      //
      // Choice 2: Redirect to login page and let user sign in manually.
      // Simpler but worse UX — user already proved identity via email link.
      // window.location.href = '/login?confirmed=true'
    } else {
      // No token or unexpected type — show error / redirect to login
      window.location.href = '/login'
    }
  }, [])

  return <p>Potwierdzanie adresu email...</p>
}
```

### 2. Post-Signup UX (before confirmation)

After calling `POST /api/auth/users/signup` and getting a success response,
show a screen telling the user to check their email:

```
Rejestracja udana!
Wysłaliśmy link potwierdzający na adres {email}.
Kliknij link w wiadomości, aby aktywować konto.

[Nie otrzymałeś emaila? Wyślij ponownie]
```

- The "resend" button should call `supabase.auth.resend({ type: 'signup', email })`
  or `POST /api/auth/users/resend` (if backend endpoint exists — currently it does NOT,
  so either add it to backend or call Supabase directly from FE for resend).

### 3. Handle `EMAIL_NOT_CONFIRMED` Error on Signin

The backend returns this error when a user tries to sign in before confirming their email:

```json
{
  "code": "EMAIL_NOT_CONFIRMED",
  "message": "Email not confirmed",
  "correlationId": "..."
}
```

**FE should:** Show a user-friendly message with a resend option:

```
Twój adres email nie został jeszcze potwierdzony.
Sprawdź skrzynkę pocztową i kliknij link aktywacyjny.

[Wyślij ponownie link aktywacyjny]
```

### 4. Token Storage & Usage

After obtaining tokens (from callback or signin), the frontend needs to:

1. **Store securely:** `access_token` and `refresh_token`
   - If using Supabase JS SDK: handled automatically (uses localStorage by default)
   - If manual: use `localStorage` or `sessionStorage` (avoid cookies for JWT)

2. **Send with API calls:** Every request to the backend must include:
   ```
   Authorization: Bearer <access_token>
   ```

3. **Handle expiry:** `access_token` expires in 3600s (1 hour).
   - If using Supabase JS SDK: auto-refresh handled
   - If manual: watch for 401 responses, then use `refresh_token` to get a new
     `access_token` via `POST https://cemblmhsimigebfdmezm.supabase.co/auth/v1/token?grant_type=refresh_token`

### 5. Shop User Flow (SHOP_USER)

Shop users have an additional step. The signup response includes:

```json
{
  "userId": "...",
  "email": "...",
  "role": "SHOP_USER",
  "requiresEnrollment": true,
  "shopId": "..."
}
```

Flow:
1. Signup → show "check your email" screen (same as USER)
2. Email confirmed → redirect to callback → auto-sign-in attempt
3. **Sign-in will FAIL** with `USER_BANNED` because shop users are banned until admin approval
4. Show: "Twoje konto warsztatu oczekuje na weryfikację. Skontaktujemy się z Tobą po zatwierdzeniu."

---

## CORS (already handled)

The backend `CORS_ALLOWED_ORIGINS` env var needs to include `https://www.autoceny.eu,https://autoceny.eu`
for the frontend to call the API. This is configured via environment variable in production.

---

## Summary Checklist

| # | Task | Owner | Details |
|---|------|-------|---------|
| 1 | Update Supabase Site URL to `https://www.autoceny.eu` | Backend/DevOps | Supabase Dashboard → Auth → URL Configuration |
| 2 | Add redirect URLs in Supabase | Backend/DevOps | `https://www.autoceny.eu/**`, `https://autoceny.eu/**`, `http://localhost:3000/**` |
| 3 | Set `CORS_ALLOWED_ORIGINS` in production | Backend/DevOps | `https://www.autoceny.eu,https://autoceny.eu` |
| 4 | Create `/auth/callback` route | Frontend | Handles Supabase redirect, parses tokens, auto-sign-in |
| 5 | Post-signup "check your email" screen | Frontend | Show after successful signup API call |
| 6 | Handle `EMAIL_NOT_CONFIRMED` on signin | Frontend | User-friendly message + resend link |
| 7 | Token storage & auth header | Frontend | Store JWT, send `Authorization: Bearer`, handle refresh |
| 8 | Shop user banned state UX | Frontend | "Pending approval" message on `USER_BANNED` error |
| 9 | (Optional) Email resend functionality | Frontend + Backend | Either call Supabase SDK directly or add backend endpoint |
