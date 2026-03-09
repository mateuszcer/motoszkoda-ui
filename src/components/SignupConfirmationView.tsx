import { useTranslation } from 'react-i18next'

interface SignupConfirmationViewProps {
  onGoToLogin: () => void
}

export function SignupConfirmationView({ onGoToLogin }: SignupConfirmationViewProps) {
  const { t } = useTranslation()

  return (
    <section className="auth-screen">
      <div className="auth-card u-text-center">
        <div className="auth-brand">
          <div className="brand-mark">
            <img src="/logo/logomark-whitee.svg" alt="" className="brand-mark-logo" />
          </div>
          <h2>{t('signupConfirmation.title')}</h2>
          <p>{t('signupConfirmation.message')}</p>
        </div>

        <button className="btn btn-primary btn-lg auth-submit" onClick={onGoToLogin}>
          {t('signupConfirmation.goToLogin')}
        </button>
      </div>
    </section>
  )
}
