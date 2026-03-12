import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BillingInterval, Entitlements, UserPlanInfo } from '../domain/apiTypes'
import type { RepairRequest } from '../domain/types'
import { formatMinorCurrency } from '../utils/format'

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

export function PlanView({
  planInfo,
  requests,
  onUpgrade,
  onManageSubscription,
  onBack,
  upgradeLoading,
  freeEntitlements,
  proPriceMonthly,
  proPriceAnnual,
  currency,
}: PlanViewProps) {
  const { t, i18n } = useTranslation()
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('MONTHLY')

  const isFree = planInfo?.planCode === 'FREE'
  const isPro = planInfo?.planCode === 'PRO'
  const isCancelScheduled = planInfo?.status === 'CANCEL_SCHEDULED'
  const isPastDue = planInfo?.status === 'PAST_DUE'

  const openCount = requests.filter((r) => r.status === 'open').length
  const today = new Date().toISOString().slice(0, 10)
  const dailyCount = requests.filter((r) => r.createdAt.slice(0, 10) === today).length

  const activePrice = billingInterval === 'ANNUAL' ? (proPriceAnnual ?? 24900) : (proPriceMonthly ?? 2900)
  const priceLabel = formatMinorCurrency(activePrice, currency, i18n.language)
  const intervalLabel = billingInterval === 'ANNUAL' ? t('plan.annual') : t('plan.monthly')

  return (
    <section className="screen plan-screen">
      <button className="btn btn-ghost back-btn" onClick={onBack}>
        {t('common.back')}
      </button>
      <h2>{t('plan.title')}</h2>

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
          <button className="btn btn-primary btn-sm" onClick={onManageSubscription}>
            {t('plan.restoreSubscription')}
          </button>
        </div>
      ) : null}

      {isPastDue ? (
        <div className="plan-warning-banner plan-warning-banner--error">
          <p>{t('plan.pastDueNotice')}</p>
          <button className="btn btn-primary btn-sm" onClick={onManageSubscription}>
            {t('plan.updatePayment')}
          </button>
        </div>
      ) : null}

      {/* Current plan card */}
      <div className="plan-card">
        <div className="plan-card-header">
          <div>
            <h3>{isFree ? t('plan.freePlan') : t('plan.proPlan')}</h3>
            <span className="pill pill-open">{t('plan.statusActive')}</span>
          </div>
        </div>
        <div className="plan-stats">
          <div className="plan-stat-row">
            <span>{t('plan.openOrders')}</span>
            <span>
              {isFree
                ? t('plan.usageOf', { used: openCount, max: freeEntitlements.maxOpenRepairRequests })
                : t('plan.unlimited')}
            </span>
          </div>
          <div className="plan-stat-row">
            <span>{t('plan.dailyOrders')}</span>
            <span>
              {isFree
                ? t('plan.usageOf', { used: dailyCount, max: freeEntitlements.maxRepairRequestsPerDay })
                : t('plan.unlimited')}
            </span>
          </div>
          <div className="plan-stat-row">
            <span>{t('plan.questionsPerOrder')}</span>
            <span>{isFree ? freeEntitlements.maxQuestionsPerRepairRequest : t('plan.unlimited')}</span>
          </div>
        </div>
      </div>

      {/* PRO management */}
      {isPro && !isCancelScheduled && !isPastDue ? (
        <button className="btn btn-ghost u-mt-4" onClick={onManageSubscription}>
          {t('plan.manageSubscription')}
        </button>
      ) : null}

      {/* Upgrade card for FREE users */}
      {isFree ? (
        <div className="plan-upgrade-card">
          <h3>{t('plan.upgradeTitle')}</h3>
          <p>{t('plan.upgradeDesc')}</p>
          <ul className="plan-upgrade-benefits">
            <li>{t('plan.upgradeBenefit1')}</li>
            <li>{t('plan.upgradeBenefit2')}</li>
            <li>{t('plan.upgradeBenefit3')}</li>
          </ul>
          <div className="plan-upgrade-price">
            {priceLabel} <span>/ {intervalLabel}</span>
          </div>
          <div className="plan-billing-toggle">
            <button
              className={`enroll-billing-btn ${billingInterval === 'MONTHLY' ? 'enroll-billing-btn--active' : ''}`}
              onClick={() => setBillingInterval('MONTHLY')}
            >
              {t('plan.monthly')}
            </button>
            <button
              className={`enroll-billing-btn ${billingInterval === 'ANNUAL' ? 'enroll-billing-btn--active' : ''}`}
              onClick={() => setBillingInterval('ANNUAL')}
            >
              {t('plan.annual')}
            </button>
          </div>
          <button
            className="btn btn-primary btn-lg u-mt-4 u-w-full"
            onClick={() => onUpgrade(billingInterval)}
            disabled={upgradeLoading}
          >
            {upgradeLoading ? '...' : t('plan.upgradeCta')}
          </button>
        </div>
      ) : null}
    </section>
  )
}
