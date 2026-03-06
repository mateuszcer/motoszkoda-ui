import { useTranslation } from 'react-i18next'

interface CheckEmailViewProps {
  email: string
  onGoToLogin: () => void
  isShop?: boolean
}

export function CheckEmailView({ email, onGoToLogin, isShop }: CheckEmailViewProps) {
  const { t } = useTranslation()

  return (
    <section className="auth-screen">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-brand">
          <div className="brand-mark">{isShop ? 'W' : 'AC'}</div>
          <h2>{t('checkEmail.title')}</h2>
          <p>
            {t('checkEmail.message', { email })}
          </p>
        </div>

        <button className="btn btn-primary btn-lg auth-submit" onClick={onGoToLogin}>
          {t('checkEmail.goToLogin')}
        </button>
      </div>
    </section>
  )
}
