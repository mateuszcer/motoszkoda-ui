import type { BillingInterval, PortalResponse, UpgradeResponse, UserPlanCatalog, UserPlanInfo } from '../domain/apiTypes'
import { api } from './apiClient'

export const billingApi = {
  async getCatalog(): Promise<UserPlanCatalog> {
    return api.get<UserPlanCatalog>('/api/billing/plans', { auth: false })
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
