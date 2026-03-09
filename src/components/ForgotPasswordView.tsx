import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

interface ForgotPasswordViewProps {
  onSubmit: (email: string, captchaToken?: string) => Promise<void>
  onBackToLogin: () => void
}

export function ForgotPasswordView({ onSubmit, onBackToLogin }: ForgotPasswordViewProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
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
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError(t('auth.captchaRequired'))
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(email.trim(), captchaToken)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgotPasswordFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <section className="auth-screen">
        <div className="auth-card u-text-center">
          <div className="auth-brand">
            <div className="brand-mark">
              <img src="/logo/logomark-main.svg" alt="" className="brand-mark-logo" />
            </div>
            <h2>{t('auth.forgotPasswordSentTitle')}</h2>
            <p>{t('auth.forgotPasswordSentMessage', { email })}</p>
          </div>

          <button className="btn btn-primary btn-lg auth-submit" onClick={onBackToLogin}>
            {t('auth.backToLogin')}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-screen">
      <form className="auth-card" onSubmit={(e) => void handleSubmit(e)}>
        <div className="auth-brand">
          <div className="brand-mark">
            <img src="/logo/logomark-main.svg" alt="" className="brand-mark-logo" />
          </div>
          <h2>{t('auth.forgotPasswordTitle')}</h2>
          <p>{t('auth.forgotPasswordSubtitle')}</p>
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
        </div>

        {TURNSTILE_SITE_KEY ? (
          <div className="turnstile-wrap">
            <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setCaptchaToken} />
          </div>
        ) : null}

        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting}>
          {submitting ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
        </button>

        <p className="auth-switch">
          <button type="button" className="btn-link" onClick={onBackToLogin}>
            {t('auth.backToLogin')}
          </button>
        </p>
      </form>
    </section>
  )
}
