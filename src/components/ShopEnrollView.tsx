import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EnrollmentStatus } from '../domain/types'

interface ShopEnrollViewProps {
  enrollmentStatus: EnrollmentStatus
  onVoucherRedeem: (code: string) => Promise<void>
  onPayment: () => Promise<void>
  onStatusRefresh: () => Promise<void>
  onLogout: () => void
}

export function ShopEnrollView({
  enrollmentStatus,
  onVoucherRedeem,
  onPayment,
  onStatusRefresh,
  onLogout,
}: ShopEnrollViewProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'voucher' | 'payment'>('voucher')
  const [voucherCode, setVoucherCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSuspended = enrollmentStatus === 'SUSPENDED'
  const isActive = enrollmentStatus === 'ACTIVE'

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherCode.trim()) return
    setError(null)
    setRedeeming(true)
    try {
      await onVoucherRedeem(voucherCode.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shopEnroll.redeemFailed'))
    } finally {
      setRedeeming(false)
    }
  }

  const handlePayment = async () => {
    setError(null)
    setPaying(true)
    try {
      await onPayment()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shopEnroll.paymentFailed'))
    } finally {
      setPaying(false)
    }
  }

  const bannerClass = isActive
    ? 'status-banner status-banner-success'
    : isSuspended
      ? 'status-banner status-banner-muted'
      : 'status-banner status-banner-warning'

  const bannerText = isActive
    ? t('shopEnroll.statusActive')
    : isSuspended
      ? t('shopEnroll.statusSuspended')
      : t('shopEnroll.statusPending')

  return (
    <section className="auth-screen">
      <div className="auth-card enroll-card">
        <div className="auth-brand">
          <div className="brand-mark brand-mark-shop">W</div>
          <h2>{t('shopEnroll.title')}</h2>
        </div>

        <div className={bannerClass}>{bannerText}</div>

        {error ? <div className="auth-error">{error}</div> : null}

        {isSuspended ? (
          <p className="enroll-support-msg">
            {t('shopEnroll.contactSupport')}
          </p>
        ) : null}

        {!isSuspended && !isActive ? (
          <>
            <div className="tab-bar">
              <button
                type="button"
                className={`tab${activeTab === 'voucher' ? ' tab-active' : ''}`}
                onClick={() => setActiveTab('voucher')}
              >
                {t('shopEnroll.tabVoucher')}
              </button>
              <button
                type="button"
                className={`tab${activeTab === 'payment' ? ' tab-active' : ''}`}
                onClick={() => setActiveTab('payment')}
              >
                {t('shopEnroll.tabPayment')}
              </button>
            </div>

            {activeTab === 'voucher' ? (
              <form className="form-grid" onSubmit={(e) => void handleRedeem(e)}>
                <label>
                  {t('shopEnroll.voucherLabel')}
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder={t('shopEnroll.voucherPlaceholder')}
                    disabled={redeeming}
                  />
                </label>
                <button
                  className="btn btn-primary btn-lg auth-submit"
                  type="submit"
                  disabled={redeeming || !voucherCode.trim()}
                >
                  {redeeming ? t('shopEnroll.redeeming') : t('shopEnroll.redeem')}
                </button>
              </form>
            ) : (
              <div className="form-grid">
                <p className="enroll-payment-desc">{t('shopEnroll.paymentDescription')}</p>
                <button
                  className="btn btn-primary btn-lg auth-submit"
                  type="button"
                  onClick={() => void handlePayment()}
                  disabled={paying}
                >
                  {paying ? t('shopEnroll.paying') : t('shopEnroll.payMonthly')}
                </button>
                <small className="field-hint">{t('shopEnroll.paymentComingSoon')}</small>
              </div>
            )}
          </>
        ) : null}

        {isActive ? (
          <button
            className="btn btn-primary btn-lg auth-submit"
            type="button"
            onClick={() => void onStatusRefresh()}
          >
            {t('shopEnroll.continueToDashboard')}
          </button>
        ) : null}

        <button
          className="btn btn-ghost auth-submit"
          type="button"
          onClick={onLogout}
          style={{ marginTop: 'var(--space-4)' }}
        >
          {t('auth.logout')}
        </button>
      </div>
    </section>
  )
}
