import { useTranslation } from 'react-i18next'
import type { SubscriptionResponse } from '../domain/apiTypes'
import type { EnrollmentStatus } from '../domain/types'
import { ShopEnrollView } from './ShopEnrollView'

interface EnrollmentGateProps {
  enrollmentStatus: EnrollmentStatus | null
  enrollmentLoading: boolean
  onVoucherRedeem: (code: string) => Promise<void>
  onPayment: () => Promise<SubscriptionResponse>
  onStatusRefresh: () => Promise<void>
  onLogout: () => void
  children: React.ReactNode
}

export function EnrollmentGate({
  enrollmentStatus,
  enrollmentLoading,
  onVoucherRedeem,
  onPayment,
  onStatusRefresh,
  onLogout,
  children,
}: EnrollmentGateProps) {
  const { t } = useTranslation()

  if (enrollmentLoading) {
    return (
      <main className="app-shell">
        <p className="loading">{t('app.loading')}</p>
      </main>
    )
  }

  if (enrollmentStatus === 'ACTIVE') {
    return <>{children}</>
  }

  // PENDING_PAYMENT, SUSPENDED, or null (unknown — treat as pending)
  const effectiveStatus: EnrollmentStatus = enrollmentStatus ?? 'PENDING_PAYMENT'

  return (
    <main className="app-shell">
      <ShopEnrollView
        enrollmentStatus={effectiveStatus}
        onVoucherRedeem={onVoucherRedeem}
        onPayment={onPayment}
        onStatusRefresh={onStatusRefresh}
        onLogout={onLogout}
      />
    </main>
  )
}
