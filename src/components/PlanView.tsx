import { useTranslation } from 'react-i18next'
import type { BillingInterval, Entitlements, UserPlanInfo } from '../domain/apiTypes'
import type { RepairRequest } from '../domain/types'
import { formatMinorCurrency } from '../utils/format'
import { formatLimit, isUnlimited } from '../utils/plan'

interface PlanViewProps {
  planInfo: UserPlanInfo | null
  requests: RepairRequest[]
  onUpgrade: (billingInterval: BillingInterval) => void
  onManageSubscription: () => void
  onBack: () => void
  upgradeLoading: boolean
  freeEntitlements: Entitlements
  proPriceMonthly: number | null
  proPriceAnnual: number | null
  currency: string
}

export function PlanView(props: PlanViewProps) {
  const {
    planInfo,
    requests,
    onUpgrade,
    onManageSubscription,
    upgradeLoading,
    freeEntitlements,
    proPriceMonthly,
    currency,
  } = props
  const { t, i18n } = useTranslation()

  const isFree = planInfo?.planCode === 'FREE'
  const isPro = planInfo?.planCode === 'PRO'
  const isCancelScheduled = planInfo?.status === 'CANCEL_SCHEDULED'
  const isPastDue = planInfo?.status === 'PAST_DUE'

  const openCount = requests.filter((r) => r.status === 'open').length
  const today = new Date().toISOString().slice(0, 10)
  const dailyCount = requests.filter((r) => r.createdAt.slice(0, 10) === today).length

  const activePrice = proPriceMonthly ?? 2900
  const priceLabel = formatMinorCurrency(activePrice, currency, i18n.language)
  const intervalLabel = t('plan.monthly')

  const maxOpen = freeEntitlements.maxOpenRepairRequests
  const maxDaily = freeEntitlements.maxRepairRequestsPerDay
  const maxQuestions = freeEntitlements.maxQuestionsPerRepairRequest

  const openPct = isFree && !isUnlimited(maxOpen) ? Math.min(100, Math.round((openCount / maxOpen) * 100)) : 0
  const dailyPct = isFree && !isUnlimited(maxDaily) ? Math.min(100, Math.round((dailyCount / maxDaily) * 100)) : 0

  return (
    <section className="plan-screen">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('plan.title')}</h1>
          <p className="page-subtitle">{t('plan.subtitle')}</p>
        </div>
      </div>

      {/* Warning banners */}
      {isCancelScheduled && planInfo?.cancelAt ? (
        <div className="plan-warning-banner">
          <p>
            {t('plan.cancelAtNotice', {
              date: new Date(planInfo.cancelAt).toLocaleDateString(i18n.language, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            })}
          </p>
          <button className="btn btn-primary" onClick={onManageSubscription}>
            {t('plan.restoreSubscription')}
          </button>
        </div>
      ) : null}

      {isPastDue ? (
        <div className="plan-warning-banner plan-warning-banner--error">
          <p>{t('plan.pastDueNotice')}</p>
          <button className="btn btn-primary" onClick={onManageSubscription}>
            {t('plan.updatePayment')}
          </button>
        </div>
      ) : null}

      <div className="plan-cards">
        {/* Plan info card */}
        <div className="card">
          <div className="plan-hero">
            <div className="plan-hero-body">
              <div className="plan-hero-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div className="u-flex" style={{ alignItems: 'center', gap: '8px' }}>
                  <span className="plan-hero-name">{isFree ? t('plan.freePlan') : t('plan.proPlan')}</span>
                  <span className="badge badge-green">
                    <span className="badge-dot" />
                    {t('plan.statusActive')}
                  </span>
                </div>
                <div className="plan-hero-desc">{isFree ? t('plan.planDescFree') : t('plan.planDescPro')}</div>
              </div>
            </div>
            {isPro && !isCancelScheduled && !isPastDue ? (
              <button className="view-link" onClick={onManageSubscription}>
                {t('plan.manageSubscription')}
              </button>
            ) : null}
          </div>
        </div>

        {/* Usage card */}
        <div className="card">
          <div className="card-header">
            <span>{t('plan.usage')}</span>
          </div>
          <div className="plan-stats">
            <div className="plan-stat-row">
              <div className="plan-stat-row-header">
                <span>{t('plan.openOrders')}</span>
                <span>
                  {isFree && !isUnlimited(maxOpen)
                    ? t('plan.usageOf', { used: openCount, max: maxOpen })
                    : t('plan.unlimited')}
                </span>
              </div>
              {isFree && !isUnlimited(maxOpen) ? (
                <div className="plan-usage-bar">
                  <div className="plan-usage-fill" style={{ width: `${openPct}%` }} />
                </div>
              ) : null}
            </div>
            <div className="plan-stat-row">
              <div className="plan-stat-row-header">
                <span>{t('plan.dailyOrders')}</span>
                <span>
                  {isFree && !isUnlimited(maxDaily)
                    ? t('plan.usageOf', { used: dailyCount, max: maxDaily })
                    : t('plan.unlimited')}
                </span>
              </div>
              {isFree && !isUnlimited(maxDaily) ? (
                <div className="plan-usage-bar">
                  <div className="plan-usage-fill" style={{ width: `${dailyPct}%` }} />
                </div>
              ) : null}
            </div>
            <div className="plan-stat-row">
              <div className="plan-stat-row-header">
                <span>{t('plan.questionsPerOrder')}</span>
                <span>{isFree ? formatLimit(maxQuestions, t) : t('plan.unlimited')}</span>
              </div>
              {isFree && !isUnlimited(maxQuestions) ? (
                <div className="plan-stat-note">{t('plan.questionsNote', { max: maxQuestions })}</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Upgrade CTA card (free only) */}
        {isFree ? (
          <div className="card">
            <div className="plan-stats">
              <div className="plan-upgrade-header">
                <div>
                  <div className="plan-upgrade-title">{t('plan.needMore')}</div>
                  <div className="plan-upgrade-desc">{t('plan.proRemovesLimits')}</div>
                </div>
                <div className="plan-upgrade-price">
                  <div className="plan-upgrade-price-amount">{priceLabel}</div>
                  <div className="plan-upgrade-price-interval">/ {intervalLabel}</div>
                </div>
              </div>
              <div className="plan-upgrade-features">
                <div className="plan-upgrade-feature">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('plan.benefitNoLimitRequests')}
                </div>
                <div className="plan-upgrade-feature">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('plan.benefitNoLimitQuestions')}
                </div>
                <div className="plan-upgrade-feature">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('plan.benefitPriorityNotifs')}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => onUpgrade('MONTHLY')} disabled={upgradeLoading}>
                {upgradeLoading ? '...' : t('plan.upgradeCta')}
              </button>
            </div>
          </div>
        ) : null}

        {/* Notifications card (static) */}
        <div className="card">
          <div className="card-header">
            <span>{t('plan.notifications')}</span>
          </div>
          <div className="plan-stats">
            <div className="plan-notify-row">
              <div>
                <div className="plan-notify-label">{t('plan.emailNotif')}</div>
                <div className="plan-notify-desc">{t('plan.emailNotifDesc')}</div>
              </div>
              <div className="toggle-switch toggle-switch-on">
                <div className="toggle-switch-knob" />
              </div>
            </div>
            <div className="plan-notify-row">
              <div>
                <div className="plan-notify-label">{t('plan.pushNotif')}</div>
                <div className="plan-notify-desc">{t('plan.pushNotifDesc')}</div>
              </div>
              <div className="toggle-switch">
                <div className="toggle-switch-knob" />
              </div>
            </div>
          </div>
        </div>

        {/* Account info card (static) */}
        <div className="card">
          <div className="card-header">
            <span>{t('plan.accountInfo')}</span>
            <button className="view-link">{t('plan.edit')}</button>
          </div>
          <div className="plan-stats">
            <div className="plan-account-grid">
              <div>
                <div className="plan-account-label">{t('plan.fullName')}</div>
                <div className="plan-account-value">Jan Kowalski</div>
              </div>
              <div>
                <div className="plan-account-label">{t('plan.email')}</div>
                <div className="plan-account-value">jan@example.pl</div>
              </div>
              <div>
                <div className="plan-account-label">{t('plan.phone')}</div>
                <div className="plan-account-value">+48 500 123 456</div>
              </div>
              <div>
                <div className="plan-account-label">{t('plan.location')}</div>
                <div className="plan-account-value">Wroclaw</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
