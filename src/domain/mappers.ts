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

export function mapShopRequestStatus(
  status: string | null,
  lastMessageType: string | null,
): QuoteState {
  switch (status) {
    case 'PENDING':
      return 'delivered'
    case 'ACKNOWLEDGED':
      if (lastMessageType === 'QUESTION') return 'question_sent'
      return 'acknowledged'
    case 'QUOTED':
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
      vin: raw.vin ?? '',
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

export function mapCompareToShopQuote(
  cv: CompareViewResponse,
  interested: boolean,
  ignored: boolean,
): ShopQuoteCard {
  let quote: QuoteOffer | undefined
  if (cv.quoteSummary) {
    quote = {
      minPricePln: cv.quoteSummary.priceMinorUnits / 100,
      durationDays: cv.quoteSummary.estimatedDays ?? undefined,
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

export function mapThread(
  summary: ThreadSummaryResponse,
  shopName: string,
  messages: ThreadMessage[],
): ShopThread {
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

export function mapShopOwnResponse(raw: ShopRequestResponse): ShopOwnResponse {
  const quotes: QuoteOffer[] = raw.quotes.map((q) => ({
    minPricePln: q.priceMinorUnits / 100,
    durationDays: q.estimatedDays ?? undefined,
    comment: q.note ?? undefined,
  }))

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
    phone: raw.phone,
    description: raw.description,
    lat: raw.lat,
    lon: raw.lon,
  }
}
