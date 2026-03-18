import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../services/apiClient'
import { getApiErrorMessage } from '../utils/apiErrors'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

interface AdminLoginViewProps {
  onLogin: (email: string, password: string, captchaToken?: string) => Promise<void>
}

export function AdminLoginView({ onLogin }: AdminLoginViewProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)
  const turnstileRef = useRef<TurnstileInstance>(null)

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
      if (err instanceof ApiError && err.code === 'ROLE_MISMATCH') {
        setError(t('admin.notAdmin'))
      } else {
        setError(getApiErrorMessage(err, t, 'admin.loginFailed'))
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
        <div className="auth-brand">
          <div className="brand-mark admin-brand-mark">AD</div>
          <h2>{t('admin.loginTitle')}</h2>
          <p>{t('admin.loginSubtitle')}</p>
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
        </div>

        {TURNSTILE_SITE_KEY ? (
          <div className="turnstile-wrap">
            <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} onSuccess={setCaptchaToken} />
          </div>
        ) : null}

        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting}>
          {submitting ? t('admin.loggingIn') : t('admin.login')}
        </button>
      </form>
    </section>
  )
}
