// Raw backend response/request types — 1:1 with OpenAPI specs

// ── Auth ─────────────────────────────────────────────────────────────

export type ApiRole = 'USER' | 'SHOP_USER' | 'ADMIN'

export interface SignupRequest {
  email: string
  password: string
  captchaToken?: string | null
}

export interface SignupResponse {
  userId: string
  email: string
  role: ApiRole
  requiresApproval: boolean
}

export interface SigninRequest {
  email: string
  password: string
  captchaToken?: string | null
}

export interface SigninResponse {
  userId: string
  email: string
  role: ApiRole
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// ── Repair Request ───────────────────────────────────────────────────

export type ApiRequestStatus = 'OPEN' | 'CLOSED' | 'EXPIRED'
export type ApiUrgency = 'ASAP' | 'THIS_WEEK' | 'FLEXIBLE'

export interface CreateRepairRequestRequest {
  make: string
  model: string
  year: number
  description: string
  latitude: number
  longitude: number
  radiusKm: number
  vin?: string
  variant?: string
  engineType?: string
  fuelType?: string
  mileageKm?: number
  categories?: string[]
  urgency?: ApiUrgency
}

export interface RepairRequestResponse {
  id: string
  driverId: string
  status: ApiRequestStatus
  vin: string | null
  make: string
  model: string
  variant: string | null
  year: number
  engineType: string | null
  fuelType: string | null
  mileageKm: number | null
  description: string
  categories: string[] | null
  latitude: number
  longitude: number
  radiusKm: number
  urgency: ApiUrgency | null
  createdAt: string
  updatedAt: string
}

// ── Shop Response ────────────────────────────────────────────────────

export type ApiShopRequestStatus = 'PENDING' | 'ACKNOWLEDGED' | 'QUOTED' | 'DECLINED'

export interface LineItemResponse {
  id: string
  position: number
  description: string
  totalPriceMinMinor: number | null
  totalPriceMaxMinor: number | null
  workPriceMinMinor: number | null
  workPriceMaxMinor: number | null
  partsPriceMinMinor: number | null
  partsPriceMaxMinor: number | null
}

export interface QuoteResponse {
  id: string
  priceMinMinorUnits: number
  priceMaxMinorUnits: number
  currency: string
  estimatedDays: number | null
  note: string | null
  lineItems: LineItemResponse[]
  createdAt: string
}

export interface ShopRequestResponse {
  id: string
  deliveryId: string
  repairRequestId: string
  shopId: string
  status: ApiShopRequestStatus
  sharedPhone: string | null
  phoneSharedAt: string | null
  quotes: QuoteResponse[]
  createdAt: string
  updatedAt: string
}

export interface ShopResponseForDriverView {
  id: string
  deliveryId: string
  repairRequestId: string
  shopId: string
  status: ApiShopRequestStatus
  sharedPhone: string | null
  phoneSharedAt: string | null
  quotes: QuoteResponse[]
  createdAt: string
  updatedAt: string
}

// ── Read Model (Compare View) ────────────────────────────────────────

export interface CompareQuoteSummary {
  priceMinMinorUnits: number
  priceMaxMinorUnits: number
  currency: string
  estimatedDays: number | null
  note: string | null
}

export interface CompareViewResponse {
  shopId: string
  shopName: string
  logoUrl: string | null
  distanceKm: number
  shopRequestStatus: ApiShopRequestStatus | null
  quoteSummary: CompareQuoteSummary | null
  lastMessageAt: string | null
  lastMessageType: ApiMessageType | null
  phone: string | null
}

// ── Messaging ────────────────────────────────────────────────────────

export type ApiMessageType = 'QUESTION' | 'MESSAGE'
export type ApiSenderRole = 'DRIVER' | 'SHOP'

export interface SendMessageRequest {
  content: string
}

export interface MessageResponse {
  id: string
  repairRequestId: string
  shopId: string
  senderId: string
  senderRole: ApiSenderRole
  messageType: ApiMessageType
  content: string
  createdAt: string
}

export interface ThreadSummaryResponse {
  shopId: string
  messageCount: number
  lastMessageAt: string
  lastMessageType: ApiMessageType
  lastSenderRole: ApiSenderRole
}

// ── Notifications ────────────────────────────────────────────────────

export type ApiNotificationType =
  | 'REQUEST_DELIVERED_TO_SHOP'
  | 'SHOP_ACKNOWLEDGED_REQUEST'
  | 'SHOP_ASKED_QUESTION'
  | 'SHOP_SENT_QUOTE'

export interface NotificationResponse {
  id: string
  type: ApiNotificationType
  payload: Record<string, unknown>
  read: boolean
  createdAt: string
}

export interface NotificationPageResponse {
  notifications: NotificationResponse[]
  hasMore: boolean
}

export interface UnreadCountResponse {
  count: number
}

// ── Attachments ──────────────────────────────────────────────────────

export type ApiTargetType = 'REPAIR_REQUEST' | 'MESSAGE_THREAD'
export type ApiAttachmentStatus = 'PENDING_UPLOAD' | 'ACTIVE' | 'DELETED'

export interface UploadUrlRequest {
  targetType: ApiTargetType
  repairRequestId: string
  fileName: string
  contentType: 'image/jpeg' | 'image/png' | 'image/webp'
  sizeBytes: number
  shopId?: string
  messageId?: string
}

export interface UploadUrlResponse {
  attachmentId: string
  uploadUrl: string
  /** Content-Type the signed URL was created with — must be sent on the PUT request. */
  contentType: string
}

export interface AttachmentResponse {
  id: string
  uploaderId: string
  targetType: ApiTargetType
  repairRequestId: string
  shopId: string | null
  messageId: string | null
  fileName: string
  contentType: string
  sizeBytes: number
  status: ApiAttachmentStatus
  createdAt: string
}

export interface DownloadUrlResponse {
  attachmentId: string
  downloadUrl: string
}

// ── Shop Queue (Read Model) ─────────────────────────────────────────

export interface ShopQueueItemResponse {
  repairRequestId: string
  make: string
  model: string
  year: number
  description: string
  urgency: string | null
  categories: string[] | null
  requestStatus: string
  distanceKm: number
  shopRequestStatus: ApiShopRequestStatus | null
  deliveredAt: string
  quoteCount: number
  hasQuote: boolean
  hasMessages: boolean
  lastActivityAt: string
}

export interface ShopQueueResponse {
  items: ShopQueueItemResponse[]
  hasMore: boolean
  nextCursor: string | null
}

// ── Shop Submit Quote ───────────────────────────────────────────────

export interface LineItemRequest {
  position: number
  description: string
  totalPriceMinMinor?: number
  totalPriceMaxMinor?: number
  workPriceMinMinor?: number
  workPriceMaxMinor?: number
  partsPriceMinMinor?: number
  partsPriceMaxMinor?: number
}

export interface SubmitQuoteRequest {
  priceMinMinorUnits?: number
  priceMaxMinorUnits?: number
  currency: string
  estimatedDays?: number
  note?: string
  lineItems?: LineItemRequest[]
}

export interface SharePhoneRequest {
  phone: string
}

// ── Shop Info / Profile ─────────────────────────────────────────────

export interface ShopInfoResponse {
  shopId: string
  name: string
  address: string
  phone: string
  description: string
  lat: number
  lon: number
}

export interface UpdateShopRequest {
  name: string
  address: string
  phone?: string
  description?: string
  lat: number
  lon: number
}

// ── Billing ─────────────────────────────────────────────────────────

export type BillingInterval = 'MONTHLY' | 'ANNUAL'

export interface InitiatePaymentRequest {
  billingInterval: BillingInterval
}

// ── Enrollment ──────────────────────────────────────────────────────

export interface ShopRegistrationRequest {
  email: string
  password: string
  name: string
  address: string
  contactPhoneE164: string
  contactEmail?: string
  description?: string
  lat: number
  lon: number
  legalName: string
  nip: string
  billingStreet: string
  billingCity: string
  billingPostalCode: string
  billingCountry?: string
  invoiceEmail?: string
  termsVersion?: string
  captchaToken?: string | null
}

export interface ShopRegistrationResponse {
  userId: string
  shopId: string
  email: string
  enrollmentStatus: 'PENDING_PAYMENT' | 'ACTIVE' | 'SUSPENDED' | 'CANCEL_SCHEDULED'
}

export interface EnrollWithVoucherRequest {
  voucherCode: string
}

export interface EnrollmentStatusResponse {
  shopId: string
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'SUSPENDED' | 'CANCEL_SCHEDULED'
  cancelAt?: string
}

export interface SubscriptionResponse {
  subscriptionId: string
  clientSecret: string
}

// ── Driver Billing ──────────────────────────────────────────────────

export type PlanCode = 'FREE' | 'PRO'
export type PlanStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'PAST_DUE' | 'CANCEL_SCHEDULED' | 'CANCELLED'

export interface UserPlanInfo {
  planCode: PlanCode
  status: PlanStatus
  billingInterval?: BillingInterval
  cancelAt?: string
}

export interface UpgradeResponse {
  checkoutUrl: string
}

export interface PortalResponse {
  portalUrl: string
}

// ── Token Refresh ───────────────────────────────────────────────────

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// ── Email Preferences ───────────────────────────────────────────────

export interface EmailPreferenceResponse {
  emailNotificationsEnabled: boolean
}

// ── Common Error ─────────────────────────────────────────────────────

export interface ApiErrorResponse {
  code: string
  message: string
  details?: string[]
  correlationId?: string
}

// ── Admin ───────────────────────────────────────────────────────────

export interface CreateVoucherRequest {
  code: string
}

export interface VoucherResponse {
  id: string
  code: string
}

// ── Plan Catalog (public) ──────────────────────────────────────────

export interface Entitlements {
  maxRepairRequestsPerDay: number
  maxOpenRepairRequests: number
  maxQuestionsPerRepairRequest: number
}

export interface PlanPrice {
  billingInterval: BillingInterval
  price: number // minor units (grosze), e.g. 2900 = 29 PLN
}

export interface UserPlanOption {
  code: PlanCode
  nameKey: string
  prices: PlanPrice[]
  entitlements: Entitlements
}

export interface UserPlanCatalog {
  currency: string
  plans: UserPlanOption[]
}

export interface EnrollmentPlanPrice {
  billingInterval: BillingInterval
  price: number
}

export interface EnrollmentPlanCatalog {
  currency: string
  prices: EnrollmentPlanPrice[]
}
