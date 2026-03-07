import { useTranslation } from 'react-i18next'

interface PlanCancelViewProps {
  onBack: () => void
}

export function PlanCancelView({ onBack }: PlanCancelViewProps) {
  const { t } = useTranslation()

  return (
    <section className="screen plan-cancel-screen">
      <div className="plan-result">
        <h2>{t('plan.cancelTitle')}</h2>
        <p>{t('plan.cancelMessage')}</p>
        <button className="btn btn-primary btn-lg" onClick={onBack}>
          {t('plan.cancelCta')}
        </button>
      </div>
    </section>
  )
}
