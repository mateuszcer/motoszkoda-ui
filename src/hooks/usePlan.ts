import { useCallback, useEffect, useState } from 'react'
import type { UserPlanInfo } from '../domain/apiTypes'
import type { RepairRequest } from '../domain/types'
import { billingApi } from '../services/billingApi'

export const FREE_LIMITS = {
  maxOpen: 3,
  maxDaily: 1,
  maxQuestionsPerOrder: 2,
}

export function usePlan(isAuthenticated: boolean, isDriver: boolean) {
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  const isFree = planInfo?.planCode === 'FREE'
  const isPro = planInfo?.planCode === 'PRO'

  useEffect(() => {
    if (!isAuthenticated || !isDriver) {
      setPlanInfo(null)
      return
    }
    setPlanLoading(true)
    billingApi.getPlan()
      .then(setPlanInfo)
      .catch(() => {
        // Default to FREE if billing service unavailable
        setPlanInfo({ planCode: 'FREE', status: 'ACTIVE' })
      })
      .finally(() => setPlanLoading(false))
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

  const isAtOpenLimit = useCallback((requests: RepairRequest[]) => {
    if (!isFree) return false
    return getOpenCount(requests) >= FREE_LIMITS.maxOpen
  }, [isFree, getOpenCount])

  const isAtDailyLimit = useCallback((requests: RepairRequest[]) => {
    if (!isFree) return false
    const today = new Date().toISOString().slice(0, 10)
    const todayCount = requests.filter(
      (r) => r.createdAt.slice(0, 10) === today,
    ).length
    return todayCount >= FREE_LIMITS.maxDaily
  }, [isFree])

  const isAtQuestionLimit = useCallback((request: RepairRequest, shopId: string) => {
    if (!isFree) return false
    const thread = request.threads[shopId]
    if (!thread) return false
    const driverMessages = thread.messages.filter((m) => m.author === 'driver').length
    return driverMessages >= FREE_LIMITS.maxQuestionsPerOrder
  }, [isFree])

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
  }
}
