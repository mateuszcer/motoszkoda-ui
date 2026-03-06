import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BillingInterval, SubscriptionResponse } from '../domain/apiTypes'
import type { EnrollmentStatus } from '../domain/types'
import { StripePaymentForm } from './StripePaymentForm'

type PaymentStep = 'idle' | 'ready' | 'success' | 'polling' | 'timeout'

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 15

interface ShopEnrollViewProps {
  enrollmentStatus: EnrollmentStatus
  onVoucherRedeem: (code: string) => Promise<void>
  onPayment: (billingInterval: BillingInterval) => Promise<SubscriptionResponse>
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
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('MONTHLY')
  const [voucherOpen, setVoucherOpen] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('idle')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)

  const isSuspended = enrollmentStatus === 'SUSPENDED'
  const isActive = enrollmentStatus === 'ACTIVE'

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const startPolling = () => {
    setPaymentStep('polling')
    pollCountRef.current = 0

    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(() => {
      pollCountRef.current += 1

      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
        setPaymentStep('timeout')
        return
      }

      void onStatusRefresh().catch(() => {
        // Network errors count toward max attempts but don't stop polling
      })
    }, POLL_INTERVAL_MS)
  }

  // If enrollment becomes ACTIVE while polling, stop and transition
  useEffect(() => {
    if (isActive && paymentStep === 'polling') {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
      setPaymentStep('success')
    }
  }, [isActive, paymentStep])

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

  const handleInitiatePayment = async () => {
    setError(null)
    setPaying(true)
    try {
      const result = await onPayment(billingInterval)
      setClientSecret(result.clientSecret)
      setPaymentStep('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shopEnroll.paymentFailed'))
    } finally {
      setPaying(false)
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentStep('success')
    startPolling()
  }

  const handleRetryPolling = () => {
    startPolling()
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
          <div className="brand-mark">W</div>
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
            {paymentStep === 'polling' || paymentStep === 'timeout' ? (
              <div className="form-grid">
                {paymentStep === 'polling' ? (
                  <p className="enroll-payment-desc">{t('shopEnroll.activating')}</p>
                ) : (
                  <>
                    <div className="auth-error">{t('shopEnroll.activationTimeout')}</div>
                    <button
                      className="btn btn-primary btn-lg auth-submit"
                      type="button"
                      onClick={handleRetryPolling}
                    >
                      {t('shopEnroll.retryActivation')}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="form-grid">
                  <p className="enroll-payment-desc">{t('shopEnroll.paymentDescription')}</p>

                  {paymentStep === 'idle' ? (
                    <>
                      <div className="enroll-billing-toggle">
                        <button
                          type="button"
                          className={`enroll-billing-btn${billingInterval === 'MONTHLY' ? ' enroll-billing-btn--active' : ''}`}
                          onClick={() => setBillingInterval('MONTHLY')}
                        >
                          {t('shopEnroll.monthly')}
                        </button>
                        <button
                          type="button"
                          className={`enroll-billing-btn${billingInterval === 'ANNUAL' ? ' enroll-billing-btn--active' : ''}`}
                          onClick={() => setBillingInterval('ANNUAL')}
                        >
                          {t('shopEnroll.annual')}
                          {' '}
                          <span className="enroll-save-pill">{t('shopEnroll.savePercent', { percent: 17 })}</span>
                        </button>
                      </div>

                      <div className="enroll-price">
                        {billingInterval === 'ANNUAL' ? (
                          <>
                            <span className="enroll-price-original">{t('shopEnroll.priceOriginalAnnual')}</span>
                            {' '}
                            <strong>{t('shopEnroll.priceAnnual')}</strong>
                          </>
                        ) : (
                          <strong>{t('shopEnroll.priceMonthly')}</strong>
                        )}
                      </div>
                    </>
                  ) : null}

                  {paymentStep === 'ready' && clientSecret ? (
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      onSuccess={handlePaymentSuccess}
                    />
                  ) : (
                    <button
                      className="btn btn-primary btn-lg auth-submit"
                      type="button"
                      onClick={() => void handleInitiatePayment()}
                      disabled={paying}
                    >
                      {paying
                        ? t('shopEnroll.paying')
                        : billingInterval === 'ANNUAL'
                          ? t('shopEnroll.payAnnual')
                          : t('shopEnroll.payMonthly')}
                    </button>
                  )}
                </div>

                {paymentStep === 'idle' ? (
                  <div className="enroll-voucher-toggle">
                    {!voucherOpen ? (
                      <button
                        type="button"
                        className="enroll-voucher-link"
                        onClick={() => setVoucherOpen(true)}
                      >
                        {t('shopEnroll.haveVoucher')}
                      </button>
                    ) : (
                      <form className="enroll-voucher-inline" onSubmit={(e) => void handleRedeem(e)}>
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          placeholder={t('shopEnroll.voucherPlaceholder')}
                          disabled={redeeming}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          type="submit"
                          disabled={redeeming || !voucherCode.trim()}
                        >
                          {redeeming ? t('shopEnroll.redeeming') : t('shopEnroll.redeem')}
                        </button>
                      </form>
                    )}
                  </div>
                ) : null}
              </>
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
