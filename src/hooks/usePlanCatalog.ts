import { useCallback, useEffect, useState } from 'react'
import type {
  BillingInterval,
  Entitlements,
  EnrollmentPlanCatalog,
  PlanCode,
  UserPlanCatalog,
} from '../domain/apiTypes'
import { billingApi } from '../services/billingApi'
import { enrollmentApi } from '../services/enrollmentApi'

const DEFAULT_FREE_ENTITLEMENTS: Entitlements = {
  maxRepairRequestsPerDay: 1,
  maxOpenRepairRequests: 3,
  maxQuestionsPerRepairRequest: 2,
}

export function usePlanCatalog() {
  const [billingCatalog, setBillingCatalog] = useState<UserPlanCatalog | null>(null)
  const [enrollmentCatalog, setEnrollmentCatalog] = useState<EnrollmentPlanCatalog | null>(null)

  useEffect(() => {
    const load = async () => {
      const [billing, enrollment] = await Promise.allSettled([billingApi.getCatalog(), enrollmentApi.getCatalog()])
      if (billing.status === 'fulfilled') setBillingCatalog(billing.value)
      if (enrollment.status === 'fulfilled') setEnrollmentCatalog(enrollment.value)
    }
    void load()
  }, [])

  const getEntitlements = useCallback(
    (planCode: PlanCode): Entitlements => {
      const plan = billingCatalog?.plans.find((p) => p.code === planCode)
      return plan?.entitlements ?? DEFAULT_FREE_ENTITLEMENTS
    },
    [billingCatalog],
  )

  const getPlanPrice = useCallback(
    (planCode: PlanCode, interval: BillingInterval): number | null => {
      const plan = billingCatalog?.plans.find((p) => p.code === planCode)
      return plan?.prices.find((p) => p.billingInterval === interval)?.price ?? null
    },
    [billingCatalog],
  )

  const getEnrollmentPrice = useCallback(
    (interval: BillingInterval): number | null => {
      return enrollmentCatalog?.prices.find((p) => p.billingInterval === interval)?.price ?? null
    },
    [enrollmentCatalog],
  )

  return {
    billingCatalog,
    enrollmentCatalog,
    getEntitlements,
    getPlanPrice,
    getEnrollmentPrice,
    currency: billingCatalog?.currency ?? 'PLN',
    enrollmentCurrency: enrollmentCatalog?.currency ?? 'PLN',
  }
}
