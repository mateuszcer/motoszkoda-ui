import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../utils/apiErrors'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

type LoginMode = 'driver' | 'workshop'

interface LoginViewProps {
  onDriverLogin: (email: string, password: string, captchaToken?: string) => Promise<void>
  onShopLogin: (email: string, password: string, captchaToken?: string) => Promise<void>
  onSwitchToDriverRegister: () => void
  onSwitchToShopRegister: () => void
  onForgotPassword?: () => void
  initialMode?: LoginMode
}

export function LoginView({
  onDriverLogin,
  onShopLogin,
  onSwitchToDriverRegister,
  onSwitchToShopRegister,
  onForgotPassword,
  initialMode = 'driver',
}: LoginViewProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<LoginMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
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
    setError(null)
  }

  const isDriver = mode === 'driver'
  const onLogin = isDriver ? onDriverLogin : onShopLogin
  const titleKey = isDriver ? 'auth.loginTitle' : 'shopAuth.loginTitle'
  const subtitleKey = isDriver ? 'auth.loginSubtitle' : 'shopAuth.loginSubtitle'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
      setError(getApiErrorMessage(err, t, 'auth.loginFailed'))
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

        <div className={`auth-role-badge auth-role-badge--${mode}`}>
          {isDriver ? (
            <svg
              width="14"
              height="14"
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
          ) : (
            <svg
              width="14"
              height="14"
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
          )}
          {isDriver ? t('auth.roleBadgeDriver') : t('auth.roleBadgeWorkshop')}
        </div>

        {error ? <div className="auth-error">{error}</div> : null}

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

        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting}>
          {submitting ? t('auth.loggingIn') : t('auth.login')}
        </button>

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
