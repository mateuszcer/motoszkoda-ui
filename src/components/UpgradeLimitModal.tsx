import { useTranslation } from 'react-i18next'
import { FREE_LIMITS } from '../hooks/usePlan'

type LimitType = 'open_orders' | 'daily_orders' | 'questions'

interface UpgradeLimitModalProps {
  limitType: LimitType
  onUpgrade: () => void
  onDismiss: () => void
  loading: boolean
}

const LIMIT_KEYS: Record<LimitType, { title: string; message: string; max: number }> = {
  open_orders: { title: 'plan.limitOpenTitle', message: 'plan.limitOpenMessage', max: FREE_LIMITS.maxOpen },
  daily_orders: { title: 'plan.limitDailyTitle', message: 'plan.limitDailyMessage', max: FREE_LIMITS.maxDaily },
  questions: { title: 'plan.limitQuestionsTitle', message: 'plan.limitQuestionsMessage', max: FREE_LIMITS.maxQuestionsPerOrder },
}

export function UpgradeLimitModal({ limitType, onUpgrade, onDismiss, loading }: UpgradeLimitModalProps) {
  const { t } = useTranslation()
  const { title, message, max } = LIMIT_KEYS[limitType]

  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{t(title)}</h3>
        <p>{t(message, { max })}</p>
        <p className="upgrade-modal-price">{t('plan.upgradeModalPrice')}</p>
        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={onUpgrade} disabled={loading}>
            {loading ? '...' : t('plan.upgradeModalCta')}
          </button>
          <button className="btn btn-ghost" onClick={onDismiss}>
            {t('plan.upgradeModalDismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
