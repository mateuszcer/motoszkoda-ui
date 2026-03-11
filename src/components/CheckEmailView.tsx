import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../utils/apiErrors'

interface CheckEmailViewProps {
  email: string
  onGoToLogin: () => void
  onResendConfirmation?: (email: string) => Promise<void>
}

export function CheckEmailView({ email, onGoToLogin, onResendConfirmation }: CheckEmailViewProps) {
  const { t } = useTranslation()
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleResend = async () => {
    if (!onResendConfirmation) return
    setResendError(null)
    setResending(true)
    try {
      await onResendConfirmation(email)
      setResent(true)
    } catch (err) {
      setResendError(getApiErrorMessage(err, t, 'auth.resendFailed'))
    } finally {
      setResending(false)
    }
  }

  return (
    <section className="auth-screen">
      <div className="auth-card u-text-center">
        <div className="auth-brand">
          <div className="brand-mark">
            <img src="/logo/logomark-whitee.svg" alt="" className="brand-mark-logo" />
          </div>
          <h2>{t('checkEmail.title')}</h2>
          <p>{t('checkEmail.message', { email })}</p>
        </div>

        {resendError ? <div className="auth-error">{resendError}</div> : null}

        {resent ? <p className="auth-success">{t('auth.resendSuccess')}</p> : null}

        <button className="btn btn-primary btn-lg auth-submit" onClick={onGoToLogin}>
          {t('checkEmail.goToLogin')}
        </button>

        {onResendConfirmation ? (
          <p className="auth-switch">
            {t('auth.didntGetEmail')}{' '}
            <button
              type="button"
              className="btn-link"
              onClick={() => void handleResend()}
              disabled={resending || resent}
            >
              {resending ? t('auth.resending') : t('auth.resendEmail')}
            </button>
          </p>
        ) : null}
      </div>
    </section>
  )
}
