import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSignupErrorMessage } from '../utils/signupErrors'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

interface RegisterViewProps {
  onRegister: (email: string, password: string, captchaToken?: string) => Promise<void>
  onSwitchToLogin: () => void
  titleKey?: string
  subtitleKey?: string
  brandMark?: string
}

export function RegisterView({ onRegister, onSwitchToLogin, titleKey, subtitleKey, brandMark }: RegisterViewProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('auth.emailInvalid'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError(t('auth.captchaRequired'))
      return
    }

    setSubmitting(true)
    try {
      await onRegister(email.trim(), password, captchaToken)
    } catch (err) {
      const mapped = getSignupErrorMessage(err, t)
      setError(mapped ?? (err instanceof Error ? err.message : t('auth.registerFailed')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-screen">
      <form className="auth-card" onSubmit={(e) => void handleSubmit(e)}>
        <div className="auth-brand">
          <div className="brand-mark">{brandMark ?? 'AC'}</div>
          <h2>{titleKey ? t(titleKey as 'auth.registerTitle') : t('auth.registerTitle')}</h2>
          <p>{subtitleKey ? t(subtitleKey as 'auth.registerSubtitle') : t('auth.registerSubtitle')}</p>
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
              autoComplete="new-password"
            />
          </label>

          <label>
            {t('auth.confirmPassword')}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
          </label>
        </div>

        {TURNSTILE_SITE_KEY ? (
          <div className="turnstile-wrap">
            <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setCaptchaToken} />
          </div>
        ) : null}

        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting}>
          {submitting ? t('auth.registering') : t('auth.register')}
        </button>

        <p className="auth-switch">
          {t('auth.hasAccount')}{' '}
          <button type="button" className="btn-link" onClick={onSwitchToLogin}>
            {t('auth.loginLink')}
          </button>
        </p>
      </form>
    </section>
  )
}
