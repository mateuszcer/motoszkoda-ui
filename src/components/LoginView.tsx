import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>
  onSwitchToRegister: () => void
}

export function LoginView({ onLogin, onSwitchToRegister }: LoginViewProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

    setSubmitting(true)
    try {
      await onLogin(email.trim(), password)
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
          <div className="brand-mark">AC</div>
          <h2>{t('auth.loginTitle')}</h2>
          <p>{t('auth.loginSubtitle')}</p>
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
