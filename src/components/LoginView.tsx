import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

interface LoginViewProps {
  onLogin: (email: string, password: string, captchaToken?: string) => Promise<void>
  onSwitchToRegister: () => void
  onForgotPassword?: () => void
  titleKey?: string
  subtitleKey?: string
  brandMark?: string
}

export function LoginView({
  onLogin,
  onSwitchToRegister,
  onForgotPassword,
  titleKey,
  subtitleKey,
  brandMark,
}: LoginViewProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)

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
      setError(err instanceof Error ? err.message : t('auth.loginFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-screen">
      <form className="auth-card" onSubmit={(e) => void handleSubmit(e)}>
        <div className="auth-brand">
          <div className="brand-mark">{brandMark ?? 'AC'}</div>
          <h2>{titleKey ? t(titleKey as 'auth.loginTitle') : t('auth.loginTitle')}</h2>
          <p>{subtitleKey ? t(subtitleKey as 'auth.loginSubtitle') : t('auth.loginSubtitle')}</p>
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
            <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setCaptchaToken} />
          </div>
        ) : null}

        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting}>
          {submitting ? t('auth.loggingIn') : t('auth.login')}
        </button>

        <p className="auth-switch">
          {t('auth.noAccount')}{' '}
          <button type="button" className="btn-link" onClick={onSwitchToRegister}>
            {t('auth.registerLink')}
          </button>
        </p>
      </form>
    </section>
  )
}
