import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ResetPasswordViewProps {
  accessToken: string
  onSubmit: (accessToken: string, newPassword: string) => Promise<void>
  onGoToLogin: () => void
}

export function ResetPasswordView({ accessToken, onSubmit, onGoToLogin }: ResetPasswordViewProps) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(accessToken, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetPasswordFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <section className="auth-screen">
        <div className="auth-card u-text-center">
          <div className="auth-brand">
            <div className="brand-mark">AC</div>
            <h2>{t('auth.resetPasswordSuccessTitle')}</h2>
            <p>{t('auth.resetPasswordSuccessMessage')}</p>
          </div>

          <button className="btn btn-primary btn-lg auth-submit" onClick={onGoToLogin}>
            {t('auth.backToLogin')}
          </button>
        </div>
      </section>
    )
  }

  if (!accessToken) {
    return (
      <section className="auth-screen">
        <div className="auth-card u-text-center">
          <div className="auth-brand">
            <div className="brand-mark">AC</div>
            <h2>{t('auth.resetPasswordTitle')}</h2>
            <p>{t('auth.resetPasswordInvalidLink')}</p>
          </div>

          <button className="btn btn-primary btn-lg auth-submit" onClick={onGoToLogin}>
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
          <div className="brand-mark">AC</div>
          <h2>{t('auth.resetPasswordTitle')}</h2>
          <p>{t('auth.resetPasswordSubtitle')}</p>
        </div>

        {error ? <div className="auth-error">{error}</div> : null}

        <div className="form-grid">
          <label>
            {t('auth.newPassword')}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.newPasswordPlaceholder')}
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

        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting}>
          {submitting ? t('auth.resettingPassword') : t('auth.resetPassword')}
        </button>

        <p className="auth-switch">
          <button type="button" className="btn-link" onClick={onGoToLogin}>
            {t('auth.backToLogin')}
          </button>
        </p>
      </form>
    </section>
  )
}
