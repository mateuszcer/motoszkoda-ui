import type {
  BillingInterval,
  PortalResponse,
  UpgradeResponse,
  UserPlanCatalog,
  UserPlanInfo,
} from '../domain/apiTypes'
import { api, cachedGet } from './apiClient'

export const billingApi = {
  async getCatalog(): Promise<UserPlanCatalog> {
    return cachedGet<UserPlanCatalog>('/api/billing/plans', {
      auth: false,
      cacheKey: 'billing_plans',
      ttlMs: 60 * 60 * 1000,
    })
  },

  async getPlan(): Promise<UserPlanInfo> {
    return api.get<UserPlanInfo>('/api/billing/plan')
  },

  async upgrade(billingInterval: BillingInterval): Promise<UpgradeResponse> {
    return api.post<UpgradeResponse>('/api/billing/plan/upgrade', {
      body: { billingInterval },
    })
  },

  async portal(): Promise<PortalResponse> {
    return api.post<PortalResponse>('/api/billing/plan/portal')
  },
}
