import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Attachment, RepairRequest, ShopQuoteCard, SortQuotesBy } from '../domain/types'
import { getDownloadUrl } from '../services/attachmentApi'
import { formatDateTime, formatLineItemRange, formatQuoteRange } from '../utils/format'
import { ImageLightbox } from './ImageLightbox'
import { QuoteDetailPanel } from './QuoteDetailPanel'
import { ShopAvatar } from './ShopAvatar'
import { ShopThreadPanel } from './ShopThreadPanel'

interface RepairRequestDetailProps {
  request: RepairRequest
  onCloseRequest: (requestId: string) => Promise<void>
  onMarkInterested: (requestId: string, shopId: string) => Promise<void>
  onIgnoreShop: (requestId: string, shopId: string) => Promise<void>
  onSendThreadMessage: (
    requestId: string,
    shopId: string,
    text: string,
    attachments: Attachment[],
    files?: Map<string, File>,
  ) => Promise<void>
  showCloseDialog: boolean
  onShowCloseDialog: (show: boolean) => void
}

type DetailTab = 'quotes' | 'qna'

const sortQuotes = (quotes: ShopQuoteCard[], sortBy: SortQuotesBy): ShopQuoteCard[] => {
  return [...quotes].sort((a, b) => {
    if (a.interested !== b.interested) {
      return a.interested ? -1 : 1
    }

    if (a.ignored !== b.ignored) {
      return a.ignored ? 1 : -1
    }

    if (sortBy === 'cheapest') {
      const aPrice = a.quote?.minPricePln ?? Number.POSITIVE_INFINITY
      const bPrice = b.quote?.minPricePln ?? Number.POSITIVE_INFINITY
      if (aPrice !== bPrice) {
        return aPrice - bPrice
      }
    }

    if (sortBy === 'closest') {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm
      }
    }

    return Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt)
  })
}

const stateMessageKeys: Record<ShopQuoteCard['state'], string> = {
  delivered: 'detail.stateDelivered',
  acknowledged: 'detail.stateAcknowledged',
  question_sent: 'detail.stateQuestionSent',
  quote_sent: 'detail.stateQuoteSent',
  declined: 'detail.stateDeclined',
}

const sortLabelKeys: Record<SortQuotesBy, string> = {
  newest: 'detail.sortNewest',
  cheapest: 'detail.sortCheapest',
  closest: 'detail.sortClosest',
}

const statusBadgeClass = (status: string) => {
  if (status === 'open') return 'badge badge-green'
  if (status === 'closed') return 'badge badge-gray'
  return 'badge'
}

const quoteStateBadgeClass = (state: ShopQuoteCard['state']) => {
  if (state === 'quote_sent') return 'badge badge-green'
  if (state === 'question_sent') return 'badge badge-amber'
  if (state === 'acknowledged') return 'badge badge-amber'
  return 'badge badge-gray'
}

export function RepairRequestDetail({
  request,
  onCloseRequest,
  onMarkInterested,
  onIgnoreShop,
  onSendThreadMessage,
  showCloseDialog,
  onShowCloseDialog,
}: RepairRequestDetailProps) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<DetailTab>('quotes')
  const [sortBy, setSortBy] = useState<SortQuotesBy>('newest')
  const [interestedOnly, setInterestedOnly] = useState(false)
  const [activeThreadShopId, setActiveThreadShopId] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [pendingShopAction, setPendingShopAction] = useState<string | null>(null)
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({})
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null)
  const [quoteDetailShop, setQuoteDetailShop] = useState<ShopQuoteCard | null>(null)
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({})
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)

  useEffect(() => {
    const atts = request.issue.attachments.filter((a) => a.kind === 'image' && !a.previewUrl)
    if (atts.length === 0) return

    let cancelled = false
    void Promise.all(
      atts.map(async (att) => {
        try {
          const url = await getDownloadUrl(att.id)
          return [att.id, url] as const
        } catch {
          return null
        }
      }),
    ).then((results) => {
      if (cancelled) return
      const urls: Record<string, string> = {}
      for (const r of results) {
        if (r) urls[r[0]] = r[1]
      }
      setAttachmentUrls((prev) => ({ ...prev, ...urls }))
    })

    return () => {
      cancelled = true
    }
  }, [request.issue.attachments])

  const isReadOnly = request.status === 'closed'

  const displayedQuotes = useMemo(() => {
    const filtered = interestedOnly ? request.shopQuotes.filter((quote) => quote.interested) : request.shopQuotes

    return sortQuotes(filtered, sortBy)
  }, [interestedOnly, request.shopQuotes, sortBy])

  const activeThread = useMemo(() => {
    if (!activeThreadShopId) {
      return null
    }

    const existing = request.threads[activeThreadShopId]
    if (existing) {
      return existing
    }

    const shop = request.shopQuotes.find((item) => item.shopId === activeThreadShopId)
    if (!shop) {
      return null
    }

    return {
      shopId: shop.shopId,
      shopName: shop.shopName,
      logoUrl: shop.logoUrl,
      unreadCount: 0,
      lastActivityAt: shop.lastUpdatedAt,
      messages: [],
    }
  }, [activeThreadShopId, request.shopQuotes, request.threads])

  const unansweredCount = useMemo(() => {
    return request.shopQuotes.filter((shop) => {
      if (shop.state !== 'question_sent') return false
      const thread = request.threads[shop.shopId]
      if (!thread || thread.messages.length === 0) return true
      return thread.messages[thread.messages.length - 1].author === 'other'
    }).length
  }, [request.shopQuotes, request.threads])

  const threadRows = useMemo(() => {
    const rows = request.shopQuotes
      .filter((shop) => request.threads[shop.shopId] || shop.state === 'question_sent')
      .map((shop) => {
        const thread = request.threads[shop.shopId]
        const lastMessage = thread?.messages[thread.messages.length - 1]
        const needsReply =
          shop.state === 'question_sent' &&
          (!thread || thread.messages.length === 0 || thread.messages[thread.messages.length - 1].author === 'other')
        return {
          shop,
          unreadCount: thread?.unreadCount ?? 0,
          preview: lastMessage?.text ?? shop.questionPreview ?? 'No messages yet.',
          needsReply,
        }
      })

    return rows.sort((a, b) => {
      const aActivity = request.threads[a.shop.shopId]?.lastActivityAt ?? a.shop.lastUpdatedAt
      const bActivity = request.threads[b.shop.shopId]?.lastActivityAt ?? b.shop.lastUpdatedAt
      return Date.parse(bActivity) - Date.parse(aActivity)
    })
  }, [request.shopQuotes, request.threads])

  const openThread = (shopId: string) => {
    setActiveThreadShopId(shopId)
  }

  const handleCloseRequest = async () => {
    setClosing(true)
    try {
      await onCloseRequest(request.id)
      onShowCloseDialog(false)
    } finally {
      setClosing(false)
    }
  }

  const handleMarkInterested = async (shopId: string) => {
    setPendingShopAction(shopId)
    try {
      await onMarkInterested(request.id, shopId)
    } finally {
      setPendingShopAction(null)
    }
  }

  const handleIgnore = async (shopId: string) => {
    setPendingShopAction(shopId)
    try {
      await onIgnoreShop(request.id, shopId)
    } finally {
      setPendingShopAction(null)
    }
  }

  const quoteCount = request.shopQuotes.filter((s) => s.state === 'quote_sent').length
  const makeInitials = (request.car.make || '').slice(0, 2).toUpperCase()

  return (
    <section className="screen">
      <div className="driver-detail-grid detail-two-col">
        {/* LEFT COLUMN */}
        <div className="driver-detail-left">
          {/* Compact header row */}
          <div className="driver-detail-header">
            <div className="vehicle-icon-lg">{makeInitials}</div>
            <div className="u-flex-1">
              <h2>
                {request.car.make} {request.car.model}
              </h2>
              <p className="page-subtitle">
                {request.issue.description.length > 60
                  ? request.issue.description.slice(0, 60) + '...'
                  : request.issue.description}{' '}
                &middot; {t('detail.radiusUpdated', { radius: request.location.radiusKm })} &middot;{' '}
                {formatDateTime(request.updatedAt, i18n.language)}
              </p>
            </div>
            <span className={statusBadgeClass(request.status)}>
              <span className="badge-dot" />
              {t(`status.${request.status}`)}
            </span>
          </div>

          {/* Main content card with embedded tabs */}
          <div className="card">
            <div className="card-header">
              <nav className="tabs-nav" role="tablist" aria-label="Request sections">
                <button
                  className={`tab-item ${activeTab === 'quotes' ? 'tab-item-active' : ''}`}
                  role="tab"
                  onClick={() => setActiveTab('quotes')}
                >
                  {t('detail.quotesTab', { count: quoteCount })}
                </button>
                <button
                  className={`tab-item ${activeTab === 'qna' ? 'tab-item-active' : ''}`}
                  role="tab"
                  onClick={() => setActiveTab('qna')}
                >
                  {t('detail.qnaTab', { count: threadRows.length })}
                  {unansweredCount > 0 ? <span className="tab-count">{unansweredCount}</span> : null}
                </button>
              </nav>

              {/* Sort chips — only on quotes tab */}
              {activeTab === 'quotes' ? (
                <div className="u-flex u-gap-3">
                  {(['newest', 'cheapest', 'closest'] as SortQuotesBy[]).map((value) => (
                    <button
                      key={value}
                      className={`chip ${sortBy === value && !interestedOnly ? 'chip-active' : ''}`}
                      onClick={() => {
                        setSortBy(value)
                        setInterestedOnly(false)
                      }}
                    >
                      {t(sortLabelKeys[value])}
                    </button>
                  ))}
                  <button
                    className={`chip ${interestedOnly ? 'chip-active' : ''}`}
                    onClick={() => setInterestedOnly((prev) => !prev)}
                  >
                    {t('detail.filterInterested')}
                  </button>
                </div>
              ) : null}
            </div>

            {/* QUOTES TAB CONTENT */}
            {activeTab === 'quotes' ? (
              <div className="shop-detail-tab-content">
                {displayedQuotes.length === 0 ? (
                  <div className="empty-state">
                    <h3>{t('detail.noQuotesTitle')}</h3>
                    <p>{t('detail.noQuotesDesc')}</p>
                  </div>
                ) : null}

                {displayedQuotes.map((shop) => {
                  const thread = request.threads[shop.shopId]
                  const isBusy = pendingShopAction === shop.shopId

                  return (
                    <div className="driver-quote-card" key={shop.shopId}>
                      {/* Quote card header */}
                      <div className="driver-quote-card-header">
                        <div className="driver-quote-card-header-info">
                          <ShopAvatar name={shop.shopName} logoUrl={shop.logoUrl} />
                          <div>
                            <div className="vehicle-name">{shop.shopName}</div>
                            <div className="vehicle-desc">
                              {t('detail.kmAway', { distance: shop.distanceKm.toFixed(1) })} &middot;{' '}
                              {t('detail.receivedAt', { date: formatDateTime(shop.lastUpdatedAt, i18n.language) })}
                            </div>
                          </div>
                        </div>
                        <div className="u-flex u-gap-3">
                          <span className={quoteStateBadgeClass(shop.state)}>
                            <span className="badge-dot" />
                            {t(`quoteState.${shop.state}`)}
                          </span>
                          {shop.interested ? (
                            <span className="badge badge-green">{t('detail.filterInterested')}</span>
                          ) : null}
                          {shop.ignored ? <span className="badge badge-gray">{t('detail.ignored')}</span> : null}
                        </div>
                      </div>

                      {/* Quote card body */}
                      <div className="driver-quote-card-body">
                        {/* State message */}
                        <p className="u-text-muted">{t(stateMessageKeys[shop.state])}</p>

                        {/* Question preview */}
                        {shop.state === 'question_sent' ? (
                          <>
                            <div className="question-preview">{shop.questionPreview}</div>
                            <div className="driver-quote-actions">
                              <button
                                className="btn btn-primary"
                                onClick={() => openThread(shop.shopId)}
                                disabled={isReadOnly}
                              >
                                {t('detail.answer')}
                              </button>
                              <button
                                className="btn btn-ghost"
                                onClick={() => void handleIgnore(shop.shopId)}
                                disabled={isReadOnly || isBusy}
                              >
                                {t('detail.ignore')}
                              </button>
                            </div>
                          </>
                        ) : null}

                        {/* Quote details */}
                        {shop.state === 'quote_sent' && shop.quote ? (
                          <>
                            <div className="u-flex u-gap-3" style={{ alignItems: 'baseline', marginBottom: 12 }}>
                              <span
                                className="driver-quote-price"
                                role="button"
                                tabIndex={0}
                                onClick={() => setQuoteDetailShop(shop)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') setQuoteDetailShop(shop)
                                }}
                              >
                                {formatQuoteRange(shop.quote, i18n.language)}
                              </span>
                              {shop.quote.durationDays ? (
                                <span className="u-text-muted">
                                  &middot; {t('detail.estimatedTime', { count: shop.quote.durationDays })}
                                </span>
                              ) : null}
                            </div>

                            {shop.quote.comment ? (
                              <p className="u-text-muted" style={{ marginBottom: 16 }}>
                                {shop.quote.comment}
                              </p>
                            ) : null}

                            {/* Line items */}
                            {shop.quote.lineItems && shop.quote.lineItems.length > 0 ? (
                              <div style={{ borderTop: '0.5px solid var(--gray-200)', paddingTop: 12 }}>
                                <div className="sidebar-section-title" style={{ marginBottom: 8 }}>
                                  {t('detail.lineItemsBreakdown')}
                                </div>
                                {shop.quote.lineItems.map((li, idx) => (
                                  <div className="summary-box-row" key={li.id ?? idx}>
                                    <span>{li.description}</span>
                                    <span className="summary-box-row-value">
                                      {formatLineItemRange(li, i18n.language)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {/* Quote validity */}
                            {shop.quote.validUntil ? (
                              <small className="u-text-muted u-mt-3" style={{ display: 'block' }}>
                                {t('detail.validUntil', {
                                  date: formatDateTime(shop.quote.validUntil, i18n.language),
                                })}
                              </small>
                            ) : null}

                            {/* Action buttons */}
                            {!shop.interested && !shop.ignored ? (
                              <div className="driver-quote-actions">
                                <button
                                  className="btn btn-primary"
                                  onClick={() => openThread(shop.shopId)}
                                  disabled={isReadOnly}
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                  </svg>
                                  {t('detail.writeMessage')}
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => void handleMarkInterested(shop.shopId)}
                                  disabled={isReadOnly || isBusy}
                                >
                                  {t('detail.markInterested')}
                                </button>
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => void handleIgnore(shop.shopId)}
                                  disabled={isReadOnly || isBusy}
                                >
                                  {t('detail.ignore')}
                                </button>
                              </div>
                            ) : null}

                            {/* Interested state with phone */}
                            {shop.interested ? (
                              <div className="driver-quote-actions">
                                <span className="badge badge-green">{t('detail.filterInterested')}</span>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => openThread(shop.shopId)}
                                  disabled={isReadOnly}
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                  </svg>
                                  {t('detail.writeMessage')}
                                </button>
                                {shop.phone ? (
                                  revealedPhones[shop.shopId] ? (
                                    <button
                                      className="btn btn-secondary"
                                      onClick={() => {
                                        void navigator.clipboard.writeText(shop.phone!).then(() => {
                                          setCopiedPhone(shop.shopId)
                                          setTimeout(() => setCopiedPhone(null), 2000)
                                        })
                                      }}
                                      title={t('detail.copyPhone')}
                                    >
                                      {copiedPhone === shop.shopId ? t('detail.phoneCopied') : shop.phone}
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-secondary"
                                      onClick={() => setRevealedPhones((prev) => ({ ...prev, [shop.shopId]: true }))}
                                    >
                                      {t('detail.showPhone')}
                                    </button>
                                  )
                                ) : null}
                              </div>
                            ) : null}
                          </>
                        ) : null}

                        {/* Unread thread messages */}
                        {thread && thread.unreadCount > 0 ? (
                          <button className="btn btn-secondary u-mt-3" onClick={() => openThread(shop.shopId)}>
                            {t('detail.viewThread', { count: thread.unreadCount })}
                          </button>
                        ) : null}

                        {isReadOnly ? <small className="read-only-note">{t('detail.requestClosed')}</small> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {/* Q&A TAB CONTENT */}
            {activeTab === 'qna' ? (
              <div className="shop-detail-tab-content">
                {unansweredCount > 0 ? (
                  <div className="qna-urgency-banner">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {t('detail.unansweredBanner')}
                  </div>
                ) : null}

                {threadRows.length === 0 ? (
                  <article className="empty-state">{t('detail.noConversations')}</article>
                ) : null}

                {threadRows.map((row) => (
                  <article
                    className={`thread-row ${row.needsReply ? 'thread-row-pending' : ''}`}
                    key={row.shop.shopId}
                    onClick={() => openThread(row.shop.shopId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openThread(row.shop.shopId)
                    }}
                  >
                    <div className="thread-row-main">
                      <ShopAvatar name={row.shop.shopName} logoUrl={row.shop.logoUrl} size="sm" />
                      <div>
                        <h3>{row.shop.shopName}</h3>
                        <p>{row.preview}</p>
                      </div>
                    </div>
                    <div className="thread-row-actions">
                      {row.needsReply ? (
                        <span className="pill pill-pending-question">{t('detail.pendingQuestion')}</span>
                      ) : null}
                      {row.unreadCount > 0 ? <span className="pill pill-alert">{row.unreadCount}</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT COLUMN — SIDEBAR */}
        <div className="driver-detail-right">
          {/* Vehicle data card */}
          <div className="card">
            <div className="card-header">
              <span className="sidebar-section-title">{t('detail.vehicleData')}</span>
            </div>
            <div className="sidebar-card-body">
              <div className="summary-box-row">
                <span className="summary-box-row-key">{t('form.make')}</span>
                <span className="summary-box-row-value">{request.car.make}</span>
              </div>
              <div className="summary-box-row">
                <span className="summary-box-row-key">{t('form.model')}</span>
                <span className="summary-box-row-value">{request.car.model}</span>
              </div>
              {request.car.year ? (
                <div className="summary-box-row">
                  <span className="summary-box-row-key">{t('form.year')}</span>
                  <span className="summary-box-row-value">{request.car.year}</span>
                </div>
              ) : null}
              {request.car.variant ? (
                <div className="summary-box-row">
                  <span className="summary-box-row-key">{t('form.variant')}</span>
                  <span className="summary-box-row-value">{request.car.variant}</span>
                </div>
              ) : null}
              {request.car.vin ? (
                <div className="summary-box-row">
                  <span className="summary-box-row-key">VIN</span>
                  <span className="summary-box-row-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {request.car.vin}
                  </span>
                </div>
              ) : null}
              {request.car.mileageKm ? (
                <div className="summary-box-row">
                  <span className="summary-box-row-key">{t('form.mileageKm')}</span>
                  <span className="summary-box-row-value">
                    {request.car.mileageKm.toLocaleString(i18n.language)} km
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Issue description card */}
          <div className="card">
            <div className="card-header">
              <span className="sidebar-section-title">{t('detail.issueTitle')}</span>
            </div>
            <div className="sidebar-card-body">
              {request.issue.tags.length > 0 ? (
                <div className="u-flex u-gap-3" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
                  {request.issue.tags.map((tag) => (
                    <span className="badge badge-gray" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{request.issue.description}</p>
            </div>
          </div>

          {/* Photos card */}
          <div className="card">
            <div className="card-header">
              <span className="sidebar-section-title">{t('detail.photosTitle')}</span>
            </div>
            {request.issue.attachments.length > 0 ? (
              <div className="sidebar-card-body">
                <div className="attachment-grid">
                  {request.issue.attachments.map((att) => {
                    const url = att.previewUrl ?? attachmentUrls[att.id]
                    const loaded = loadedImages[att.id]
                    return (
                      <div
                        className={`attachment-thumb${!loaded ? ' loading' : ''}`}
                        key={att.id}
                        onClick={() => url && loaded && setLightboxImg({ src: url, alt: att.name })}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={att.name}
                            style={loaded ? undefined : { display: 'none' }}
                            onLoad={() => setLoadedImages((prev) => ({ ...prev, [att.id]: true }))}
                          />
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="sidebar-photos-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <div style={{ fontSize: 13 }}>{t('detail.noPhotos')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close request dialog */}
      {showCloseDialog ? (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog" role="dialog" aria-modal="true">
            <h3>{t('detail.closeDialogTitle')}</h3>
            <p>{t('detail.closeDialogMessage')}</p>
            <div className="split-actions split-actions--end">
              <button className="btn btn-ghost" onClick={() => onShowCloseDialog(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-danger" onClick={() => void handleCloseRequest()} disabled={closing}>
                {closing ? t('detail.closing') : t('detail.closeRequest')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Thread panel */}
      {activeThread ? (
        <ShopThreadPanel
          thread={activeThread}
          readOnly={isReadOnly}
          onClose={() => setActiveThreadShopId(null)}
          onSend={async (text, attachments, files) => {
            await onSendThreadMessage(request.id, activeThread.shopId, text, attachments, files)
          }}
        />
      ) : null}

      {quoteDetailShop ? <QuoteDetailPanel shop={quoteDetailShop} onClose={() => setQuoteDetailShop(null)} /> : null}

      {lightboxImg ? (
        <ImageLightbox src={lightboxImg.src} alt={lightboxImg.alt} onClose={() => setLightboxImg(null)} />
      ) : null}
    </section>
  )
}
