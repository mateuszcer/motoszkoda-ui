import { useCallback, useEffect, useState } from 'react'
import type { Entitlements, UserPlanInfo } from '../domain/apiTypes'
import type { RepairRequest } from '../domain/types'
import { billingApi } from '../services/billingApi'
import { isUnlimited } from '../utils/plan'

export function usePlan(isAuthenticated: boolean, isDriver: boolean, freeEntitlements: Entitlements) {
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  const isFree = planInfo?.planCode === 'FREE'
  const isPro = planInfo?.planCode === 'PRO'

  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated || !isDriver) {
      void Promise.resolve().then(() => {
        if (!cancelled) setPlanInfo(null)
      })
      return () => {
        cancelled = true
      }
    }
    void Promise.resolve().then(() => {
      if (cancelled) return
      setPlanLoading(true)
      billingApi
        .getPlan()
        .then((info) => {
          if (!cancelled) setPlanInfo(info)
        })
        .catch(() => {
          if (!cancelled) setPlanInfo({ planCode: 'FREE', status: 'ACTIVE' })
        })
        .finally(() => {
          if (!cancelled) setPlanLoading(false)
        })
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isDriver])

  const refreshPlan = useCallback(async () => {
    try {
      const info = await billingApi.getPlan()
      setPlanInfo(info)
      return info
    } catch {
      return planInfo
    }
  }, [planInfo])

  const getOpenCount = useCallback((requests: RepairRequest[]) => {
    return requests.filter((r) => r.status === 'open').length
  }, [])

  const isAtOpenLimit = useCallback(
    (requests: RepairRequest[]) => {
      if (!isFree) return false
      if (isUnlimited(freeEntitlements.maxOpenRepairRequests)) return false
      return getOpenCount(requests) >= freeEntitlements.maxOpenRepairRequests
    },
    [isFree, getOpenCount, freeEntitlements.maxOpenRepairRequests],
  )

  const isAtDailyLimit = useCallback(
    (requests: RepairRequest[]) => {
      if (!isFree) return false
      if (isUnlimited(freeEntitlements.maxRepairRequestsPerDay)) return false
      const today = new Date().toISOString().slice(0, 10)
      const todayCount = requests.filter((r) => r.createdAt.slice(0, 10) === today).length
      return todayCount >= freeEntitlements.maxRepairRequestsPerDay
    },
    [isFree, freeEntitlements.maxRepairRequestsPerDay],
  )

  const isAtQuestionLimit = useCallback(
    (request: RepairRequest, shopId: string) => {
      if (!isFree) return false
      if (isUnlimited(freeEntitlements.maxQuestionsPerRepairRequest)) return false
      const thread = request.threads[shopId]
      if (!thread) return false
      const driverMessages = thread.messages.filter((m) => m.author === 'self').length
      return driverMessages >= freeEntitlements.maxQuestionsPerRepairRequest
    },
    [isFree, freeEntitlements.maxQuestionsPerRepairRequest],
  )

  return {
    planInfo,
    planLoading,
    isFree,
    isPro,
    refreshPlan,
    getOpenCount,
    isAtOpenLimit,
    isAtDailyLimit,
    isAtQuestionLimit,
    freeEntitlements,
  }
}
