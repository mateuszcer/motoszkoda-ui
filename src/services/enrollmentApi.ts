import type {
  BillingInterval,
  EnrollmentPlanCatalog,
  EnrollmentStatusResponse,
  SubscriptionResponse,
  ShopRegistrationRequest,
  ShopRegistrationResponse,
} from '../domain/apiTypes'
import { api } from './apiClient'

export const enrollmentApi = {
  async getCatalog(): Promise<EnrollmentPlanCatalog> {
    return api.get<EnrollmentPlanCatalog>('/api/enrollment/plans', { auth: false })
  },

  async register(payload: ShopRegistrationRequest): Promise<ShopRegistrationResponse> {
    return api.post<ShopRegistrationResponse>('/api/enrollment/register', {
      auth: false,
      body: payload,
    })
  },

  async getStatus(): Promise<EnrollmentStatusResponse> {
    return api.get<EnrollmentStatusResponse>('/api/enrollment/status')
  },

  async redeemVoucher(code: string): Promise<EnrollmentStatusResponse> {
    return api.post<EnrollmentStatusResponse>('/api/enrollment/voucher', {
      body: { voucherCode: code },
    })
  },

  async initiatePayment(billingInterval: BillingInterval): Promise<SubscriptionResponse> {
    return api.post<SubscriptionResponse>('/api/enrollment/payment', {
      body: { billingInterval },
    })
  },
}
