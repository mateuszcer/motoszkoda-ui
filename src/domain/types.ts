export type AppScreen =
  | 'landing' | 'login' | 'register' | 'signup-confirmation' | 'home' | 'create-request' | 'my-requests' | 'request-detail'
  | 'shop-login' | 'shop-register' | 'shop-inbox' | 'shop-request-detail' | 'shop-send-quote' | 'shop-profile'
  | 'shop-enroll'
  | 'admin-login' | 'admin-vouchers'

export type EnrollmentStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'SUSPENDED'

export type RequestStatus = 'open' | 'closed'

export type QuoteState =
  | 'delivered'
  | 'acknowledged'
  | 'question_sent'
  | 'quote_sent'
  | 'declined'

export type SortQuotesBy = 'newest' | 'cheapest' | 'closest'

export type AttachmentKind = 'image' | 'video' | 'document'

export type MessageAuthor = 'driver' | 'shop'

export interface Attachment {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  previewUrl?: string
  kind: AttachmentKind
}

export interface CarDetails {
  vin: string
  make: string
  model: string
  variant: string
  year: number
  engineType?: string
  fuelType?: string
  mileageKm?: number
}

export interface IssueDetails {
  description: string
  tags: string[]
  attachments: Attachment[]
}

export interface LocationDetails {
  address: string
  latitude: number
  longitude: number
  radiusKm: number
}

export interface LineItem {
  id?: string
  position: number
  description: string
  totalPriceMinPln?: number
  totalPriceMaxPln?: number
  workPriceMinPln?: number
  workPriceMaxPln?: number
  partsPriceMinPln?: number
  partsPriceMaxPln?: number
}

export interface QuoteOffer {
  minPricePln: number
  maxPricePln?: number
  comment?: string
  durationDays?: number
  validUntil?: string
  lineItems?: LineItem[]
}

export interface ShopQuoteCard {
  shopId: string
  shopName: string
  distanceKm: number
  state: QuoteState
  questionPreview?: string
  quote?: QuoteOffer
  phone?: string
  interested: boolean
  ignored: boolean
  lastUpdatedAt: string
}

export interface ThreadMessage {
  id: string
  author: MessageAuthor
  text: string
  sentAt: string
  attachments: Attachment[]
}

export interface ShopThread {
  shopId: string
  shopName: string
  unreadCount: number
  messages: ThreadMessage[]
  lastActivityAt: string
}

export interface RepairRequest {
  id: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
  car: CarDetails
  issue: IssueDetails
  location: LocationDetails
  shopQuotes: ShopQuoteCard[]
  threads: Record<string, ShopThread>
}

export interface CreateRepairRequestPayload {
  car: CarDetails
  issue: IssueDetails
  location: LocationDetails
}

export interface SendMessagePayload {
  requestId: string
  shopId: string
  text: string
  attachments: Attachment[]
}

export interface NotificationEvent {
  id: string
  requestId: string
  shopId?: string
  type: 'new_quote' | 'shop_acknowledged' | 'new_question' | 'request_submitted'
  title: string
  message: string
  createdAt: string
}

export interface RepairRequestApi {
  listRequests: () => Promise<RepairRequest[]>
  fetchRequestDetail: (requestId: string, currentUserId: string) => Promise<RepairRequest | null>
  createRequest: (payload: CreateRepairRequestPayload) => Promise<RepairRequest>
  closeRequest: (requestId: string) => Promise<RepairRequest>
  sendThreadMessage: (payload: SendMessagePayload) => Promise<void>
  getThreadMessages: (requestId: string, shopId: string, currentUserId: string) => Promise<ThreadMessage[]>
  invalidateCache: (requestId: string) => void
}

// ── Shop Portal ─────────────────────────────────────────────────────

export type ShopInboxFilter = 'all' | 'new' | 'in_progress' | 'quoted' | 'declined'

export type ShopRequestStatus = 'PENDING' | 'ACKNOWLEDGED' | 'QUOTED' | 'DECLINED'

export interface ShopQueueItem {
  repairRequestId: string
  status: ShopRequestStatus | null
  make: string
  model: string
  year: number
  description: string
  distanceKm: number
  categories: string[]
  requestStatus: string
  deliveredAt: string
  quoteCount: number
  hasQuote: boolean
  hasMessages: boolean
  lastActivityAt: string
}

export interface ShopOwnResponse {
  id: string
  repairRequestId: string
  status: ShopRequestStatus
  sharedPhone: string | null
  quotes: QuoteOffer[]
  createdAt: string
  updatedAt: string
}

export interface LineItemPayload {
  position: number
  description: string
  totalPriceMinMinor?: number
  totalPriceMaxMinor?: number
  workPriceMinMinor?: number
  workPriceMaxMinor?: number
  partsPriceMinMinor?: number
  partsPriceMaxMinor?: number
}

export interface SubmitQuotePayload {
  priceMinMinorUnits?: number
  priceMaxMinorUnits?: number
  currency: string
  estimatedDays?: number
  note?: string
  lineItems?: LineItemPayload[]
}

export interface SharePhonePayload {
  phone: string
}

export interface ShopProfile {
  shopId: string
  name: string
  address: string
  phone: string
  description: string
  lat: number
  lon: number
}

export interface UpdateShopProfilePayload {
  name: string
  address: string
  phone?: string
  description?: string
  lat: number
  lon: number
}
