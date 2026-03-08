import type {
  AttachmentResponse,
  CompareViewResponse,
  MessageResponse,
  RepairRequestResponse,
  ShopInfoResponse,
  ShopQueueItemResponse,
  ShopRequestResponse,
  ThreadSummaryResponse,
} from './apiTypes'
import type {
  Attachment,
  AttachmentKind,
  LineItem,
  QuoteOffer,
  QuoteState,
  RepairRequest,
  RequestStatus,
  ShopOwnResponse,
  ShopProfile,
  ShopQueueItem,
  ShopQuoteCard,
  ShopThread,
  ThreadMessage,
} from './types'

// ── Status mapping ───────────────────────────────────────────────────

export function mapRequestStatus(status: string): RequestStatus {
  if (status === 'OPEN') return 'open'
  return 'closed' // CLOSED and EXPIRED both map to 'closed'
}

export function mapShopRequestStatus(status: string | null, lastMessageType: string | null): QuoteState {
  switch (status) {
    case 'PENDING':
    case 'REQUEST_DELIVERED_TO_SHOP':
      return 'delivered'
    case 'ACKNOWLEDGED':
    case 'SHOP_ACKNOWLEDGED_REQUEST':
      if (lastMessageType === 'QUESTION' || lastMessageType === 'SHOP_ASKED_QUESTION') return 'question_sent'
      return 'acknowledged'
    case 'SHOP_ASKED_QUESTION':
      return 'question_sent'
    case 'QUOTED':
    case 'SHOP_SENT_QUOTE':
      return 'quote_sent'
    case 'DECLINED':
      return 'declined'
    default:
      return 'delivered'
  }
}

// ── AttachmentResponse → Attachment ──────────────────────────────────

function getKindFromContentType(contentType: string): AttachmentKind {
  if (contentType.startsWith('image/')) return 'image'
  if (contentType.startsWith('video/')) return 'video'
  return 'document'
}

export function mapAttachment(raw: AttachmentResponse): Attachment {
  return {
    id: raw.id,
    name: raw.fileName,
    mimeType: raw.contentType,
    sizeBytes: raw.sizeBytes,
    kind: getKindFromContentType(raw.contentType),
  }
}

// ── RepairRequestResponse → RepairRequest ────────────────────────────

export function mapRepairRequest(
  raw: RepairRequestResponse,
  shopQuotes: ShopQuoteCard[] = [],
  threads: Record<string, ShopThread> = {},
  attachments: Attachment[] = [],
): RepairRequest {
  return {
    id: raw.id,
    status: mapRequestStatus(raw.status),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    car: {
      vin: raw.vin ?? undefined,
      make: raw.make,
      model: raw.model,
      variant: raw.variant ?? '',
      year: raw.year,
      engineType: raw.engineType ?? undefined,
      fuelType: raw.fuelType ?? undefined,
      mileageKm: raw.mileageKm ?? undefined,
    },
    issue: {
      description: raw.description,
      tags: raw.categories ?? [],
      attachments,
    },
    location: {
      address: '', // Backend doesn't return resolved address
      latitude: raw.latitude,
      longitude: raw.longitude,
      radiusKm: raw.radiusKm,
    },
    shopQuotes,
    threads,
  }
}

// ── CompareViewResponse → ShopQuoteCard ──────────────────────────────

export function mapCompareToShopQuote(cv: CompareViewResponse, interested: boolean, ignored: boolean): ShopQuoteCard {
  let quote: QuoteOffer | undefined
  if (cv.quoteSummary) {
    const min = cv.quoteSummary.priceMinMinorUnits / 100
    const max = cv.quoteSummary.priceMaxMinorUnits / 100
    quote = {
      minPricePln: min,
      maxPricePln: max !== min ? max : undefined,
      durationDays: cv.quoteSummary.estimatedDays ?? undefined,
      comment: cv.quoteSummary.note ?? undefined,
    }
  }

  return {
    shopId: cv.shopId,
    shopName: cv.shopName,
    distanceKm: cv.distanceKm,
    state: mapShopRequestStatus(cv.shopRequestStatus, cv.lastMessageType),
    quote,
    phone: cv.phone ?? undefined,
    interested,
    ignored,
    lastUpdatedAt: cv.lastMessageAt ?? new Date().toISOString(),
  }
}

// ── MessageResponse → ThreadMessage ──────────────────────────────────

export function mapMessage(msg: MessageResponse, currentUserId: string): ThreadMessage {
  return {
    id: msg.id,
    author: msg.senderId === currentUserId ? 'driver' : 'shop',
    text: msg.content,
    sentAt: msg.createdAt,
    attachments: [],
  }
}

// ── ThreadSummaryResponse + messages → ShopThread ────────────────────

export function mapThread(summary: ThreadSummaryResponse, shopName: string, messages: ThreadMessage[]): ShopThread {
  return {
    shopId: summary.shopId,
    shopName,
    unreadCount: 0, // managed client-side or via notifications
    messages,
    lastActivityAt: summary.lastMessageAt,
  }
}

// ── Shop Portal Mappers ─────────────────────────────────────────────

export function mapShopQueueItem(raw: ShopQueueItemResponse): ShopQueueItem {
  return {
    repairRequestId: raw.repairRequestId,
    status: raw.shopRequestStatus,
    make: raw.make,
    model: raw.model,
    year: raw.year,
    description: raw.description,
    distanceKm: raw.distanceKm,
    categories: raw.categories ?? [],
    requestStatus: raw.requestStatus,
    deliveredAt: raw.deliveredAt,
    quoteCount: raw.quoteCount,
    hasQuote: raw.hasQuote,
    hasMessages: raw.hasMessages,
    lastActivityAt: raw.lastActivityAt,
  }
}

export function mapLineItems(items: ShopRequestResponse['quotes'][number]['lineItems']): LineItem[] | undefined {
  if (!items || items.length === 0) return undefined
  return items.map((li) => ({
    id: li.id,
    position: li.position,
    description: li.description,
    totalPriceMinPln: li.totalPriceMinMinor != null ? li.totalPriceMinMinor / 100 : undefined,
    totalPriceMaxPln: li.totalPriceMaxMinor != null ? li.totalPriceMaxMinor / 100 : undefined,
    workPriceMinPln: li.workPriceMinMinor != null ? li.workPriceMinMinor / 100 : undefined,
    workPriceMaxPln: li.workPriceMaxMinor != null ? li.workPriceMaxMinor / 100 : undefined,
    partsPriceMinPln: li.partsPriceMinMinor != null ? li.partsPriceMinMinor / 100 : undefined,
    partsPriceMaxPln: li.partsPriceMaxMinor != null ? li.partsPriceMaxMinor / 100 : undefined,
  }))
}

export function mapShopOwnResponse(raw: ShopRequestResponse): ShopOwnResponse {
  const quotes: QuoteOffer[] = raw.quotes.map((q) => {
    const min = q.priceMinMinorUnits / 100
    const max = q.priceMaxMinorUnits / 100
    return {
      minPricePln: min,
      maxPricePln: max !== min ? max : undefined,
      durationDays: q.estimatedDays ?? undefined,
      comment: q.note ?? undefined,
      lineItems: mapLineItems(q.lineItems),
    }
  })

  return {
    id: raw.id,
    repairRequestId: raw.repairRequestId,
    status: raw.status,
    sharedPhone: raw.sharedPhone,
    quotes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export function mapShopProfile(raw: ShopInfoResponse): ShopProfile {
  return {
    shopId: raw.shopId,
    name: raw.name,
    address: raw.address,
    phone: raw.phone ?? '',
    description: raw.description,
    lat: raw.lat,
    lon: raw.lon,
  }
}
