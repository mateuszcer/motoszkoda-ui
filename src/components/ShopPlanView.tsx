import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EnrollmentStatus } from '../domain/types'
import { ApiError } from '../services/apiClient'
import { enrollmentApi } from '../services/enrollmentApi'

interface ShopPlanViewProps {
  enrollmentStatus: EnrollmentStatus
  cancelAt: string | null
  onBack: () => void
}

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
      window.location.href = portalUrl
    } catch {
      setPortalError(t('shopPlan.portalError'))
    } finally {
      setPortalLoading(false)
    }
  }, [t])

  const isCancelScheduled = enrollmentStatus === 'CANCEL_SCHEDULED'

  return (
    <section className="plan-screen">
      <button className="btn btn-ghost" onClick={onBack}>
        {t('common.back')}
      </button>

      <h2>{t('shopPlan.title')}</h2>

      <article className="plan-card">
        <div className="plan-card-header">
          <div>
            <h3>{t('shopPlan.planName')}</h3>
            <p className="plan-card-description">
              {isVoucher ? t('shopPlan.voucherDescription') : t('shopPlan.descriptionActive')}
            </p>
          </div>
          <span className={`pill ${isCancelScheduled ? 'pill-alert' : 'pill-open'}`}>
            {isCancelScheduled ? t('shopPlan.statusCancelScheduled') : t('shopPlan.statusActive')}
          </span>
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

        {!isVoucher ? (
          <button
            className={`btn ${isCancelScheduled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => void handlePortalClick()}
            disabled={portalLoading}
          >
            {isCancelScheduled ? t('shopPlan.restoreSubscription') : t('shopPlan.manageSubscription')}
          </button>
        ) : null}
      </article>
    </section>
  )
}
