import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EnrollmentStatus } from '../domain/types'
import { ApiError } from '../services/apiClient'
import { enrollmentApi } from '../services/enrollmentApi'
import { assertSafeRedirectUrl } from '../utils/validation'

interface ShopPlanViewProps {
  enrollmentStatus: EnrollmentStatus
  cancelAt: string | null
  onBack: () => void
}

const MOCK_PAYMENTS = [
  { date: '2026-03-01', amount: '99,00 zl' },
  { date: '2026-02-01', amount: '99,00 zl' },
  { date: '2026-01-01', amount: '99,00 zl' },
]

export function ShopPlanView({ enrollmentStatus, cancelAt, onBack }: ShopPlanViewProps) {
  const { t, i18n } = useTranslation()
  const [isVoucher, setIsVoucher] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  useEffect(() => {
    const probe = async () => {
      try {
        await enrollmentApi.portal()
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setIsVoucher(true)
        }
      }
    }
    void probe()
  }, [])

  const handlePortalClick = useCallback(async () => {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const { portalUrl } = await enrollmentApi.portal()
      assertSafeRedirectUrl(portalUrl)
      window.location.href = portalUrl
    } catch {
      setPortalError(t('shopPlan.portalError'))
    } finally {
      setPortalLoading(false)
    }
  }, [t])

  const isCancelScheduled = enrollmentStatus === 'CANCEL_SCHEDULED'

  const formatPaymentDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <section className="plan-screen">
      <button className="btn btn-ghost" onClick={onBack}>
        {t('common.back')}
      </button>

      <div className="page-header">
        <h2 className="page-title">{t('shopPlan.title')}</h2>
        <p className="u-text-muted">{t('shopPlan.subtitle')}</p>
      </div>

      {isCancelScheduled && cancelAt ? (
        <div className="plan-warning-banner">
          <p>
            {t('shopPlan.cancelAtNotice', {
              date: new Date(cancelAt).toLocaleDateString(i18n.language, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            })}
          </p>
        </div>
      ) : null}

      {portalError ? <p className="field-error">{portalError}</p> : null}

      {/* Plan hero card */}
      <div className="card shop-plan-hero">
        <div className="shop-plan-hero-body">
          <div className="shop-plan-hero-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <div className="shop-plan-hero-title">
              <span className="shop-plan-hero-name">{t('shopPlan.proName')}</span>
              <span className={`badge ${isCancelScheduled ? 'badge-amber' : 'badge-green'}`}>
                {isCancelScheduled ? t('shopPlan.statusCancelScheduled') : t('shopPlan.statusActive')}
              </span>
            </div>
            {!isVoucher ? (
              <p className="shop-plan-hero-renew">{t('shopPlan.renewsAt', { date: '1.04.2026' })}</p>
            ) : (
              <p className="shop-plan-hero-renew">{t('shopPlan.voucherDescription')}</p>
            )}
          </div>
        </div>
        {!isVoucher ? (
          <button
            className={`btn ${isCancelScheduled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => void handlePortalClick()}
            disabled={portalLoading}
          >
            {isCancelScheduled ? t('shopPlan.restoreSubscription') : t('shopPlan.manageSubscription')}
          </button>
        ) : null}
      </div>

      {/* Stats grid */}
      <div className="shop-plan-stats-grid">
        <div className="card shop-plan-stat-card">
          <span className="shop-plan-stat-label">{t('shopPlan.quotesSent')}</span>
          <span className="shop-plan-stat-value">23</span>
          <span className="shop-plan-stat-note">{t('shopPlan.unlimited')}</span>
        </div>
        <div className="card shop-plan-stat-card">
          <span className="shop-plan-stat-label">{t('shopPlan.activeConversations')}</span>
          <span className="shop-plan-stat-value">7</span>
          <span className="shop-plan-stat-note">{t('shopPlan.unlimited')}</span>
        </div>
      </div>

      {/* Features card */}
      <div className="card">
        <div className="card-header">
          <span className="card-header-title">{t('shopPlan.planIncludes')}</span>
        </div>
        <div className="shop-plan-feats">
          {([1, 2, 3, 4, 5, 6] as const).map((n, i, arr) => (
            <div className={`shop-plan-feat${i < arr.length - 1 ? ' shop-plan-feat--border' : ''}`} key={n}>
              <svg
                className="shop-plan-feat-check"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" stroke="currentColor" />
              </svg>
              <span>{t(`shopPlan.feat${n}`)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment method card (hidden for voucher) */}
      {!isVoucher ? (
        <div className="card">
          <div className="card-header">
            <span className="card-header-title">{t('shopPlan.paymentMethod')}</span>
            <button className="btn-link" onClick={() => void handlePortalClick()}>
              {t('shopPlan.changePayment')}
            </button>
          </div>
          <div className="shop-plan-payment-body">
            <div className="shop-plan-visa-icon">
              <svg width="24" height="10" viewBox="0 0 48 16">
                <rect width="48" height="16" rx="2" fill="#1A1F71" />
                <text x="6" y="12" fill="#fff" fontSize="9" fontWeight="500" fontFamily="sans-serif">
                  VISA
                </text>
              </svg>
            </div>
            <div>
              <div className="shop-plan-card-number">{t('shopPlan.visaEnding', { last4: '4242' })}</div>
              <div className="shop-plan-card-expiry">{t('shopPlan.expires', { date: '12/2027' })}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Payment history (hidden for voucher) */}
      {!isVoucher ? (
        <div className="card">
          <div className="card-header">
            <span className="card-header-title">{t('shopPlan.paymentHistory')}</span>
            <button className="btn-link" onClick={() => void handlePortalClick()}>
              {t('shopPlan.downloadInvoices')}
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('shopPlan.date')}</th>
                <th>{t('shopPlan.description')}</th>
                <th>{t('shopPlan.amount')}</th>
                <th>{t('shopPlan.status')}</th>
                <th className="u-text-right" />
              </tr>
            </thead>
            <tbody>
              {MOCK_PAYMENTS.map((p) => (
                <tr key={p.date}>
                  <td className="u-text-muted">{formatPaymentDate(p.date)}</td>
                  <td>{t('shopPlan.proName')}</td>
                  <td>{p.amount}</td>
                  <td>
                    <span className="badge badge-green">{t('shopPlan.paid')}</span>
                  </td>
                  <td className="u-text-right">
                    <button className="btn-link" onClick={() => void handlePortalClick()}>
                      {t('shopPlan.invoice')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
