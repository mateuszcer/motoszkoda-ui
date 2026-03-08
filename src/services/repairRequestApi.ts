import type {
  AttachmentResponse,
  CompareViewResponse,
  CreateRepairRequestRequest,
  MessageResponse,
  RepairRequestResponse,
  ShopResponseForDriverView,
  ThreadSummaryResponse,
} from '../domain/apiTypes'
import {
  mapAttachment,
  mapCompareToShopQuote,
  mapLineItems,
  mapMessage,
  mapRepairRequest,
  mapThread,
} from '../domain/mappers'
import type {
  CreateRepairRequestPayload,
  RepairRequest,
  RepairRequestApi,
  SendMessagePayload,
  ShopQuoteCard,
  ShopThread,
  ThreadMessage,
} from '../domain/types'
import { api } from './apiClient'
import * as prefs from './localPreferences'

// In-memory detail cache keyed by requestId
const detailCache = new Map<string, RepairRequest>()

function toApiCreatePayload(p: CreateRepairRequestPayload): CreateRepairRequestRequest {
  return {
    make: p.car.make,
    model: p.car.model,
    year: p.car.year,
    description: p.issue.description,
    latitude: p.location.latitude,
    longitude: p.location.longitude,
    radiusKm: p.location.radiusKm,
    vin: p.car.vin || undefined,
    variant: p.car.variant || undefined,
    engineType: p.car.engineType,
    fuelType: p.car.fuelType,
    mileageKm: p.car.mileageKm,
    categories: p.issue.tags.length > 0 ? p.issue.tags : undefined,
  }
}

const repairRequestApiImpl: RepairRequestApi = {
  async listRequests(): Promise<RepairRequest[]> {
    const rawList = await api.get<RepairRequestResponse[]>('/api/repair-requests')
    // List view returns skeleton requests (no shopQuotes/threads populated)
    // Previously visited details are served from cache
    return rawList.map((raw) => {
      const cached = detailCache.get(raw.id)
      if (cached) {
        // Merge latest status from API with cached detail data
        return {
          ...cached,
          status: raw.status === 'OPEN' ? ('open' as const) : ('closed' as const),
          updatedAt: raw.updatedAt,
        }
      }
      return mapRepairRequest(raw)
    })
  },

  async fetchRequestDetail(requestId: string, currentUserId: string): Promise<RepairRequest | null> {
    // Fetch repair-request, compare view, thread summaries, attachments, and shop responses in parallel
    const [rawRequest, compareData, threadSummaries, rawAttachments, shopResponses] = await Promise.all([
      api.get<RepairRequestResponse>(`/api/repair-requests/${requestId}`).catch(() => null),
      api
        .get<CompareViewResponse[]>(`/api/repair-requests/${requestId}/compare`)
        .catch(() => [] as CompareViewResponse[]),
      api
        .get<ThreadSummaryResponse[]>(`/api/repair-requests/${requestId}/messages/threads`)
        .catch(() => [] as ThreadSummaryResponse[]),
      api
        .get<AttachmentResponse[]>('/api/attachments', {
          params: { targetType: 'REPAIR_REQUEST', repairRequestId: requestId },
        })
        .catch(() => [] as AttachmentResponse[]),
      api
        .get<ShopResponseForDriverView[]>(`/api/repair-requests/${requestId}/shop-responses`)
        .catch(() => [] as ShopResponseForDriverView[]),
    ])

    if (!rawRequest) return null

    // Build shopName lookup from compare data
    const shopNameMap = new Map<string, string>()
    for (const cv of compareData) {
      shopNameMap.set(cv.shopId, cv.shopName)
    }

    // Map compare data → ShopQuoteCard[]
    const shopQuotes: ShopQuoteCard[] = compareData.map((cv) =>
      mapCompareToShopQuote(cv, prefs.isInterested(requestId, cv.shopId), prefs.isIgnored(requestId, cv.shopId)),
    )

    // Merge line items from shop responses into quote cards
    if (shopResponses.length > 0) {
      const lineItemsByShopId = new Map<string, ReturnType<typeof mapLineItems>>()
      for (const sr of shopResponses) {
        const latestQuote = sr.quotes[sr.quotes.length - 1]
        if (latestQuote?.lineItems?.length) {
          lineItemsByShopId.set(sr.shopId, mapLineItems(latestQuote.lineItems))
        }
      }
      for (const card of shopQuotes) {
        const items = lineItemsByShopId.get(card.shopId)
        if (items && card.quote) {
          card.quote.lineItems = items
        }
      }
    }

    // Fetch messages for each thread in parallel
    const threadEntries = await Promise.all(
      threadSummaries.map(async (summary): Promise<[string, ShopThread]> => {
        const rawMessages = await api
          .get<MessageResponse[]>(`/api/repair-requests/${requestId}/messages/shops/${summary.shopId}`)
          .catch(() => [] as MessageResponse[])

        const messages: ThreadMessage[] = rawMessages.map((m) => mapMessage(m, currentUserId)).reverse() // API returns newest first, UI expects oldest first

        const shopName = shopNameMap.get(summary.shopId) ?? summary.shopId
        return [summary.shopId, mapThread(summary, shopName, messages)]
      }),
    )

    const threads: Record<string, ShopThread> = Object.fromEntries(threadEntries)
    const attachments = rawAttachments.filter((a) => a.status === 'ACTIVE').map(mapAttachment)
    const result = mapRepairRequest(rawRequest, shopQuotes, threads, attachments)

    // Cache it
    detailCache.set(requestId, result)

    return result
  },

  async createRequest(payload: CreateRepairRequestPayload): Promise<RepairRequest> {
    const apiPayload = toApiCreatePayload(payload)
    const raw = await api.post<RepairRequestResponse>('/api/repair-requests', {
      body: apiPayload,
    })
    return mapRepairRequest(raw)
  },

  async closeRequest(requestId: string): Promise<RepairRequest> {
    const raw = await api.post<RepairRequestResponse>(`/api/repair-requests/${requestId}/close`)
    detailCache.delete(requestId)
    return mapRepairRequest(raw)
  },

  async sendThreadMessage({ requestId, shopId, text }: SendMessagePayload): Promise<void> {
    await api.post<MessageResponse>(`/api/repair-requests/${requestId}/messages/shops/${shopId}/message`, {
      body: { content: text },
    })
    // Invalidate cache so next detail fetch gets fresh data
    detailCache.delete(requestId)
  },

  async getThreadMessages(requestId: string, shopId: string, currentUserId: string): Promise<ThreadMessage[]> {
    const rawMessages = await api.get<MessageResponse[]>(`/api/repair-requests/${requestId}/messages/shops/${shopId}`)
    return rawMessages.map((m) => mapMessage(m, currentUserId)).reverse()
  },

  invalidateCache(requestId: string): void {
    detailCache.delete(requestId)
  },
}

export const repairRequestApi: RepairRequestApi = repairRequestApiImpl
