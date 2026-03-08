import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { UserPlanInfo } from '../domain/apiTypes'

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 15

interface PlanSuccessViewProps {
  onRefreshPlan: () => Promise<UserPlanInfo | null | undefined>
  onContinue: () => void
}

export function PlanSuccessView({ onRefreshPlan, onContinue }: PlanSuccessViewProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'polling' | 'success' | 'timeout'>('polling')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)

  useEffect(() => {
    pollRef.current = setInterval(() => {
      pollCountRef.current += 1

      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
        setStatus('timeout')
        return
      }

      void onRefreshPlan().then((info) => {
        if (info && info.planCode === 'PRO') {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
          setStatus('success')
        }
      })
    }, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [onRefreshPlan])

  return (
    <section className="screen plan-success-screen">
      {status === 'polling' ? (
        <div className="plan-polling">
          <div className="spinner" />
          <p>{t('plan.successPolling')}</p>
        </div>
      ) : status === 'success' ? (
        <div className="plan-result">
          <div className="plan-result-icon">&#10003;</div>
          <h2>{t('plan.successTitle')}</h2>
          <p>{t('plan.successMessage')}</p>
          <button className="btn btn-primary btn-lg" onClick={onContinue}>
            {t('plan.successCta')}
          </button>
        </div>
      ) : (
        <div className="plan-result">
          <p className="auth-error">{t('plan.successTimeout')}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              pollCountRef.current = 0
              setStatus('polling')
              pollRef.current = setInterval(() => {
                pollCountRef.current += 1
                if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
                  if (pollRef.current) clearInterval(pollRef.current)
                  pollRef.current = null
                  setStatus('timeout')
                  return
                }
                void onRefreshPlan().then((info) => {
                  if (info && info.planCode === 'PRO') {
                    if (pollRef.current) clearInterval(pollRef.current)
                    pollRef.current = null
                    setStatus('success')
                  }
                })
              }, POLL_INTERVAL_MS)
            }}
          >
            {t('shopEnroll.retryActivation')}
          </button>
        </div>
      )}
    </section>
  )
}
