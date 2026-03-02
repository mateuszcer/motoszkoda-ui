import type {
  EnrollmentStatusResponse,
  PaymentIntentResponse,
  ShopRegistrationRequest,
  ShopRegistrationResponse,
} from '../domain/apiTypes'
import { api } from './apiClient'

export const enrollmentApi = {
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

  async initiatePayment(): Promise<PaymentIntentResponse> {
    return api.post<PaymentIntentResponse>('/api/enrollment/payment')
  },
}
