import type {
  MessageResponse,
  RepairRequestResponse,
  ShopInfoResponse,
  ShopQueueResponse,
  ShopRequestResponse,
  SubmitQuoteRequest,
  UpdateShopRequest,
} from '../domain/apiTypes'
import {
  mapMessage,
  mapRepairRequest,
  mapShopOwnResponse,
  mapShopProfile,
  mapShopQueueItem,
} from '../domain/mappers'
import type {
  RepairRequest,
  SharePhonePayload,
  ShopOwnResponse,
  ShopProfile,
  ShopQueueItem,
  SubmitQuotePayload,
  ThreadMessage,
  UpdateShopProfilePayload,
} from '../domain/types'
import { api } from './apiClient'

export const shopApi = {
  // Read model endpoint: /api/shops/{shopId}/queue
  async fetchQueue(shopId: string): Promise<ShopQueueItem[]> {
    const res = await api.get<ShopQueueResponse>(`/api/shops/${shopId}/queue`)
    return res.items.map(mapShopQueueItem)
  },

  // Fallback: /api/shop-inbox returns ShopRequestResponse[] (shopId from JWT)
  async fetchInbox(): Promise<ShopRequestResponse[]> {
    return api.get<ShopRequestResponse[]>('/api/shop-inbox')
  },

  async fetchRequestDetail(requestId: string): Promise<RepairRequest | null> {
    const raw = await api.get<RepairRequestResponse>(`/api/repair-requests/${requestId}`).catch(() => null)
    if (!raw) return null
    return mapRepairRequest(raw)
  },

  async fetchOwnResponse(requestId: string): Promise<ShopOwnResponse | null> {
    const raw = await api.get<ShopRequestResponse>(`/api/repair-requests/${requestId}/shop-response`).catch(() => null)
    if (!raw) return null
    return mapShopOwnResponse(raw)
  },

  async acknowledge(requestId: string): Promise<void> {
    await api.post<void>(`/api/repair-requests/${requestId}/shop-actions/acknowledge`)
  },

  async decline(requestId: string): Promise<void> {
    await api.post<void>(`/api/repair-requests/${requestId}/shop-actions/decline`)
  },

  async submitQuote(requestId: string, payload: SubmitQuotePayload): Promise<void> {
    const body: SubmitQuoteRequest = {
      priceMinMinorUnits: payload.priceMinMinorUnits,
      priceMaxMinorUnits: payload.priceMaxMinorUnits,
      currency: payload.currency,
      estimatedDays: payload.estimatedDays,
      note: payload.note,
      lineItems: payload.lineItems,
    }
    await api.post<void>(`/api/repair-requests/${requestId}/shop-actions/quote`, { body })
  },

  async sharePhone(requestId: string, payload: SharePhonePayload): Promise<void> {
    await api.post<void>(`/api/repair-requests/${requestId}/shop-actions/share-phone`, {
      body: { phone: payload.phone },
    })
  },

  async sendQuestion(requestId: string, text: string): Promise<void> {
    await api.post<MessageResponse>(`/api/repair-requests/${requestId}/messages/question`, {
      body: { content: text },
    })
  },

  // Shop fetches own thread messages (shopId derived from JWT on backend)
  async fetchMessages(requestId: string, currentUserId: string): Promise<ThreadMessage[]> {
    const raw = await api.get<MessageResponse[]>(
      `/api/repair-requests/${requestId}/messages`,
    )
    return raw.map((m) => mapMessage(m, currentUserId)).reverse()
  },

  async sendMessage(requestId: string, shopId: string, text: string): Promise<void> {
    await api.post<MessageResponse>(
      `/api/repair-requests/${requestId}/messages/shops/${shopId}/message`,
      { body: { content: text } },
    )
  },

  async fetchProfile(): Promise<ShopProfile> {
    const raw = await api.get<ShopInfoResponse>('/api/shops/me')
    return mapShopProfile(raw)
  },

  async updateProfile(payload: UpdateShopProfilePayload): Promise<ShopProfile> {
    const body: UpdateShopRequest = {
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      description: payload.description,
      lat: payload.lat,
      lon: payload.lon,
    }
    const raw = await api.put<ShopInfoResponse>('/api/shops/me', { body })
    return mapShopProfile(raw)
  },
}
