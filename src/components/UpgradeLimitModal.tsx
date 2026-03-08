import { useTranslation } from 'react-i18next'
import type { Entitlements } from '../domain/apiTypes'
import { formatMinorCurrency } from '../utils/format'

type LimitType = 'open_orders' | 'daily_orders' | 'questions'

interface UpgradeLimitModalProps {
  limitType: LimitType
  onUpgrade: () => void
  onDismiss: () => void
  loading: boolean
  freeEntitlements: Entitlements
  proPriceMonthly: number | null
  currency: string
}

const LIMIT_KEYS: Record<LimitType, { title: string; message: string; entitlementKey: keyof Entitlements }> = {
  open_orders: {
    title: 'plan.limitOpenTitle',
    message: 'plan.limitOpenMessage',
    entitlementKey: 'maxOpenRepairRequests',
  },
  daily_orders: {
    title: 'plan.limitDailyTitle',
    message: 'plan.limitDailyMessage',
    entitlementKey: 'maxRepairRequestsPerDay',
  },
  questions: {
    title: 'plan.limitQuestionsTitle',
    message: 'plan.limitQuestionsMessage',
    entitlementKey: 'maxQuestionsPerRepairRequest',
  },
}

export function UpgradeLimitModal({
  limitType,
  onUpgrade,
  onDismiss,
  loading,
  freeEntitlements,
  proPriceMonthly,
  currency,
}: UpgradeLimitModalProps) {
  const { t, i18n } = useTranslation()
  const { title, message, entitlementKey } = LIMIT_KEYS[limitType]
  const max = freeEntitlements[entitlementKey]

  const priceLabel = `${formatMinorCurrency(proPriceMonthly ?? 2900, currency, i18n.language)} / ${t('plan.monthly').toLowerCase()}`

  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{t(title)}</h3>
        <p>{t(message, { max })}</p>
        <p className="upgrade-modal-price">{priceLabel}</p>
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
