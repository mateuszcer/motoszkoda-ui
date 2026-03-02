import type { VoucherResponse } from '../domain/apiTypes'
import { api } from './apiClient'

export async function createVoucher(code: string): Promise<VoucherResponse> {
  return api.post<VoucherResponse>('/api/admin/enrollment/vouchers', {
    body: { code },
  })
}
