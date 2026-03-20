import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../services/apiClient'
import { getApiErrorMessage } from '../utils/apiErrors'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

type LoginMode = 'driver' | 'workshop'

interface LoginViewProps {
  onDriverLogin: (email: string, password: string, captchaToken?: string) => Promise<void>
  onShopLogin: (email: string, password: string, captchaToken?: string) => Promise<void>
  onSwitchToDriverRegister: () => void
  onSwitchToShopRegister: () => void
  onForgotPassword?: () => void
  onGoogleLogin?: () => void
  initialMode?: LoginMode
  onModeChange?: (mode: LoginMode) => void
}

export function LoginView({
  onDriverLogin,
  onShopLogin,
  onSwitchToDriverRegister,
  onSwitchToShopRegister,
  onForgotPassword,
  onGoogleLogin,
  initialMode = 'driver',
  onModeChange,
}: LoginViewProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<LoginMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [roleMismatchTarget, setRoleMismatchTarget] = useState<LoginMode | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)
  const turnstileRef = useRef<TurnstileInstance>(null)

  // Sync mode when initialMode prop changes (e.g. navigation from shop-login redirect)
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const switchMode = (next: LoginMode) => {
    if (next === mode) return
    setMode(next)
    onModeChange?.(next)
    setError(null)
    setRoleMismatchTarget(null)
  }

  const isDriver = mode === 'driver'
  const onLogin = isDriver ? onDriverLogin : onShopLogin
  const titleKey = isDriver ? 'auth.loginTitle' : 'shopAuth.loginTitle'
  const subtitleKey = isDriver ? 'auth.loginSubtitle' : 'shopAuth.loginSubtitle'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setRoleMismatchTarget(null)

    if (!email.trim()) {
      setError(t('auth.emailRequired'))
      return
    }
    if (!password) {
      setError(t('auth.passwordRequired'))
      return
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError(t('auth.captchaRequired'))
      return
    }

    setSubmitting(true)
    try {
      await onLogin(email.trim(), password, captchaToken)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ROLE_MISMATCH') {
        setRoleMismatchTarget(isDriver ? 'workshop' : 'driver')
      } else {
        setError(getApiErrorMessage(err, t, 'auth.loginFailed'))
      }
      setCaptchaToken(undefined)
      turnstileRef.current?.reset()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-screen">
      <form className="auth-card" onSubmit={(e) => void handleSubmit(e)}>
        <div className="auth-toggle" role="tablist" aria-label={t('auth.login')}>
          <button
            type="button"
            role="tab"
            aria-selected={isDriver}
            className={`auth-toggle__btn${isDriver ? ' auth-toggle__btn--active' : ''}`}
            onClick={() => switchMode('driver')}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 17h14M5 17a2 2 0 01-2-2V9l2-4h14l2 4v6a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zm14 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {t('auth.toggleDriver')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isDriver}
            className={`auth-toggle__btn${!isDriver ? ' auth-toggle__btn--active' : ''}`}
            onClick={() => switchMode('workshop')}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
            {t('auth.toggleWorkshop')}
          </button>
        </div>

        <div className="auth-brand">
          <h2>{t(titleKey as 'auth.loginTitle')}</h2>
          <p>{t(subtitleKey as 'auth.loginSubtitle')}</p>
        </div>

        {roleMismatchTarget ? (
          <div className="auth-hint">
            <span>
              {t(roleMismatchTarget === 'driver' ? 'auth.roleMismatchToDriver' : 'auth.roleMismatchToWorkshop')}
            </span>
            <button type="button" className="btn-link" onClick={() => switchMode(roleMismatchTarget)}>
              {t('auth.roleMismatchSwitchTab')}
            </button>
          </div>
        ) : error ? (
          <div className="auth-error">{error}</div>
        ) : null}

        <div className="auth-form-card">
          <div className="form-grid">
            <label>
              {t('auth.email')}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
              />
            </label>

            <label>
              {t('auth.password')}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="current-password"
              />
            </label>

            {onForgotPassword ? (
              <div className="auth-forgot">
                <button type="button" className="btn-link" onClick={onForgotPassword}>
                  {t('auth.forgotPassword')}
                </button>
              </div>
            ) : null}
          </div>

          {TURNSTILE_SITE_KEY ? (
            <div className="turnstile-wrap">
              <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} onSuccess={setCaptchaToken} />
            </div>
          ) : null}

          <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? (
              t('auth.loggingIn')
            ) : (
              <>
                {t('auth.login')}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          {onGoogleLogin ? (
            <>
              <div className="auth-divider">{t('auth.orDivider')}</div>
              <button type="button" className="auth-google-btn" onClick={onGoogleLogin}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.43l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t('auth.continueWithGoogle')}
              </button>
            </>
          ) : null}
        </div>

        <p className="auth-switch">
          {isDriver ? t('auth.noAccount') : t('auth.shopNoAccount')}{' '}
          <button
            type="button"
            className="btn-link"
            onClick={isDriver ? onSwitchToDriverRegister : onSwitchToShopRegister}
          >
            {isDriver ? t('auth.registerLink') : t('auth.shopRegisterLink')}
          </button>
        </p>
      </form>
    </section>
  )
}
