import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Attachment, RepairRequest, ShopQuoteCard, SortQuotesBy } from '../domain/types'
import { getDownloadUrl } from '../services/attachmentApi'
import { formatDateTime, formatLineItemRange, formatQuoteRange } from '../utils/format'
import { ImageLightbox } from './ImageLightbox'
import { QuoteDetailPanel } from './QuoteDetailPanel'
import { ShopThreadPanel } from './ShopThreadPanel'

interface RepairRequestDetailProps {
  request: RepairRequest
  onBackHome: () => void
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

export function RepairRequestDetail({
  request,
  onBackHome,
  onCloseRequest,
  onMarkInterested,
  onIgnoreShop,
  onSendThreadMessage,
}: RepairRequestDetailProps) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<DetailTab>('quotes')
  const [sortBy, setSortBy] = useState<SortQuotesBy>('newest')
  const [interestedOnly, setInterestedOnly] = useState(false)
  const [expandedShops, setExpandedShops] = useState<Record<string, boolean>>({})
  const [activeThreadShopId, setActiveThreadShopId] = useState<string | null>(null)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [closing, setClosing] = useState(false)
  const [pendingShopAction, setPendingShopAction] = useState<string | null>(null)
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({})
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null)
  const [quoteDetailShop, setQuoteDetailShop] = useState<ShopQuoteCard | null>(null)

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

    return () => { cancelled = true }
  }, [request.issue.attachments])

  const isReadOnly = request.status === 'closed'

  const displayedQuotes = useMemo(() => {
    const filtered = interestedOnly
      ? request.shopQuotes.filter((quote) => quote.interested)
      : request.shopQuotes

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
      return thread.messages[thread.messages.length - 1].author === 'shop'
    }).length
  }, [request.shopQuotes, request.threads])

  const threadRows = useMemo(() => {
    const rows = request.shopQuotes
      .filter((shop) => request.threads[shop.shopId] || shop.state === 'question_sent')
      .map((shop) => {
        const thread = request.threads[shop.shopId]
        const lastMessage = thread?.messages[thread.messages.length - 1]
        const needsReply = shop.state === 'question_sent' && (!thread || thread.messages.length === 0 || thread.messages[thread.messages.length - 1].author === 'shop')
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

  const toggleExpanded = (shopId: string) => {
    setExpandedShops((previous) => ({
      ...previous,
      [shopId]: !previous[shopId],
    }))
  }

  const openThread = (shopId: string) => {
    setActiveThreadShopId(shopId)
  }

  const handleCloseRequest = async () => {
    setClosing(true)
    try {
      await onCloseRequest(request.id)
      setShowCloseDialog(false)
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

  const shopCardClass = (shop: ShopQuoteCard) => {
    const classes = ['shop-card']
    if (shop.state === 'question_sent' && !shop.ignored) classes.push('card-question')
    if (shop.interested) classes.push('card-interested')
    return classes.join(' ')
  }

  return (
    <section className="screen request-detail-screen">
      {/* Collapsible request summary */}
      <header className="request-header" style={summaryCollapsed ? { padding: 'var(--space-3) var(--space-5)' } : undefined}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
            <button className="btn btn-ghost" onClick={onBackHome} style={{ padding: 'var(--space-1) var(--space-2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <span className={`pill pill-${request.status}`}>{t(`status.${request.status}`)}</span>
          </div>
          {!summaryCollapsed ? (
            <>
              <h2>
                {request.car.make} {request.car.model} {request.car.variant}
              </h2>
              <p>{request.issue.description}</p>
              {request.issue.attachments.length > 0 ? (
                <div className="attachment-grid" style={{ marginTop: 'var(--space-2)' }}>
                  {request.issue.attachments.map((att) => {
                    const url = att.previewUrl ?? attachmentUrls[att.id]
                    const loaded = loadedImages[att.id]
                    return (
                      <div className={`attachment-thumb${!loaded ? ' loading' : ''}`} key={att.id} onClick={() => url && loaded && setLightboxImg({ src: url, alt: att.name })}>
                        {url ? <img src={url} alt={att.name} style={loaded ? undefined : { display: 'none' }} onLoad={() => setLoadedImages(prev => ({ ...prev, [att.id]: true }))} /> : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
              <small>
                {t('detail.radiusUpdated', { radius: request.location.radiusKm })} &middot; {t('detail.updated', { date: formatDateTime(request.updatedAt, i18n.language) })}
              </small>
            </>
          ) : (
            <h2 style={{ fontSize: '15px', margin: 0 }}>
              {request.car.make} {request.car.model}
            </h2>
          )}
        </div>

        <div className="request-header-actions">
          <button
            className="btn btn-ghost"
            onClick={() => setSummaryCollapsed((prev) => !prev)}
            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: '12px' }}
          >
            {summaryCollapsed ? t('common.show') : t('common.hide')}
          </button>
          {!isReadOnly ? (
            <button
              className="btn btn-danger"
              onClick={() => {
                setShowCloseDialog(true)
              }}
            >
              {t('common.close')}
            </button>
          ) : null}
        </div>
      </header>

      {/* Tabs */}
      <div className="tab-strip" role="tablist" aria-label="Request sections">
        <button
          className={`tab-btn ${activeTab === 'quotes' ? 'tab-btn-active' : ''}`}
          role="tab"
          onClick={() => {
            setActiveTab('quotes')
          }}
        >
          {t('detail.quotesTab', { count: request.shopQuotes.filter((s) => s.state === 'quote_sent').length })}
        </button>
        <button
          className={`tab-btn ${activeTab === 'qna' ? 'tab-btn-active' : ''} ${unansweredCount > 0 ? 'tab-btn-urgent' : ''}`}
          role="tab"
          onClick={() => {
            setActiveTab('qna')
          }}
        >
          {t('detail.qnaTab', { count: threadRows.length })}
          {unansweredCount > 0 ? <span className="tab-badge">{unansweredCount}</span> : null}
        </button>
      </div>

      {/* Quotes tab */}
      {activeTab === 'quotes' ? (
        <>
          {/* Sort / filter chips */}
          <div className="sort-chips">
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
              onClick={() => {
                setInterestedOnly((prev) => !prev)
              }}
            >
              {t('detail.filterInterested')}
            </button>
          </div>

          <div className="cards-stack">
            {displayedQuotes.length === 0 ? (
              <article className="empty-state">{t('detail.noShops')}</article>
            ) : null}

            {displayedQuotes.map((shop) => {
              const expanded = expandedShops[shop.shopId] ?? (shop.state === 'quote_sent' || shop.state === 'question_sent')
              const thread = request.threads[shop.shopId]
              const isBusy = pendingShopAction === shop.shopId

              return (
                <article className={shopCardClass(shop)} key={shop.shopId}>
                  <header className="shop-card-header">
                    <div>
                      <h3>{shop.shopName}</h3>
                      <small>{t('detail.kmAway', { distance: shop.distanceKm.toFixed(1) })}</small>
                      <small className="shop-card-timestamp">{t('detail.receivedAt', { date: formatDateTime(shop.lastUpdatedAt, i18n.language) })}</small>
                    </div>
                    <div className="shop-card-badges">
                      <span className={`pill state-${shop.state}`}>{t(`quoteState.${shop.state}`)}</span>
                      {shop.interested ? <span className="pill pill-interested">{t('detail.filterInterested')}</span> : null}
                      {shop.ignored ? <span className="pill pill-muted">{t('detail.ignored')}</span> : null}
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          toggleExpanded(shop.shopId)
                        }}
                        style={{ padding: 'var(--space-1) var(--space-2)', minHeight: '32px', fontSize: '13px' }}
                      >
                        {expanded ? t('detail.less') : t('detail.more')}
                      </button>
                    </div>
                  </header>

                  {expanded ? (
                    <div className="shop-card-body">
                      <p>{t(stateMessageKeys[shop.state])}</p>

                      {shop.state === 'question_sent' ? (
                        <>
                          <div className="question-preview">{shop.questionPreview}</div>
                          <div className="split-actions">
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                openThread(shop.shopId)
                              }}
                              disabled={isReadOnly}
                            >
                              {t('detail.answer')}
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => {
                                void handleIgnore(shop.shopId)
                              }}
                              disabled={isReadOnly || isBusy}
                            >
                              {t('detail.ignore')}
                            </button>
                          </div>
                        </>
                      ) : null}

                      {shop.state === 'quote_sent' && shop.quote ? (
                        <div className="quote-highlight">
                          <strong
                            className="quote-highlight-clickable"
                            role="button"
                            tabIndex={0}
                            onClick={() => setQuoteDetailShop(shop)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setQuoteDetailShop(shop) }}
                          >
                            {formatQuoteRange(shop.quote, i18n.language)}
                            <svg className="quote-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                          </strong>
                          {shop.quote.comment ? <p>{shop.quote.comment}</p> : null}
                          <div className="quote-meta">
                            {shop.quote.durationDays ? (
                              <small>{t('detail.durationDays', { count: shop.quote.durationDays })}</small>
                            ) : null}
                            {shop.quote.validUntil ? (
                              <small>{t('detail.validUntil', { date: formatDateTime(shop.quote.validUntil, i18n.language) })}</small>
                            ) : null}
                          </div>
                          {shop.quote.lineItems && shop.quote.lineItems.length > 0 ? (
                            <div className="quote-line-items-display">
                              <h5>{t('detail.lineItemsBreakdown')}</h5>
                              {shop.quote.lineItems.map((li, idx) => (
                                <div className="quote-line-item-row" key={li.id ?? idx}>
                                  <span>{li.description}</span>
                                  <span>{formatLineItemRange(li, i18n.language)}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {!shop.interested && !shop.ignored ? (
                            <div className="split-actions">
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  void handleMarkInterested(shop.shopId)
                                }}
                                disabled={isReadOnly || isBusy}
                              >
                                {t('detail.markInterested')}
                              </button>
                              <button
                                className="btn btn-ghost"
                                onClick={() => {
                                  void handleIgnore(shop.shopId)
                                }}
                                disabled={isReadOnly || isBusy}
                              >
                                {t('detail.ignore')}
                              </button>
                            </div>
                          ) : null}
                          {shop.interested ? (
                            <div className="quote-actions-interested">
                              <span className="pill pill-interested">{t('detail.filterInterested')}</span>
                              {shop.phone ? (
                                <a href={`tel:${shop.phone}`} className="btn btn-primary btn-call">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                  {t('detail.callShop')}
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {thread && thread.unreadCount > 0 ? (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            openThread(shop.shopId)
                          }}
                          style={{ marginTop: 'var(--space-3)' }}
                        >
                          {t('detail.viewThread', { count: thread.unreadCount })}
                        </button>
                      ) : null}

                      {isReadOnly ? <small className="read-only-note">{t('detail.requestClosed')}</small> : null}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </>
      ) : null}

      {/* Q&A tab */}
      {activeTab === 'qna' ? (
        <div className="cards-stack">
          {unansweredCount > 0 ? (
            <div className="qna-urgency-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {t('detail.unansweredBanner')}
            </div>
          ) : null}

          {threadRows.length === 0 ? <article className="empty-state">{t('detail.noConversations')}</article> : null}

          {threadRows.map((row) => (
            <article
              className={`thread-row ${row.needsReply ? 'thread-row-pending' : ''}`}
              key={row.shop.shopId}
              onClick={() => {
                openThread(row.shop.shopId)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') openThread(row.shop.shopId)
              }}
            >
              <div>
                <h3>{row.shop.shopName}</h3>
                <p>{row.preview}</p>
              </div>
              <div className="thread-row-actions">
                {row.needsReply ? <span className="pill pill-pending-question">{t('detail.pendingQuestion')}</span> : null}
                {row.unreadCount > 0 ? <span className="pill pill-alert">{row.unreadCount}</span> : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {/* Close request dialog */}
      {showCloseDialog ? (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog" role="dialog" aria-modal="true">
            <h3>{t('detail.closeDialogTitle')}</h3>
            <p>{t('detail.closeDialogMessage')}</p>
            <div className="split-actions" style={{ justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowCloseDialog(false)
                }}
              >
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
          onClose={() => {
            setActiveThreadShopId(null)
          }}
          onSend={async (text, attachments, files) => {
            await onSendThreadMessage(request.id, activeThread.shopId, text, attachments, files)
          }}
        />
      ) : null}

      {quoteDetailShop ? (
        <QuoteDetailPanel
          shop={quoteDetailShop}
          onClose={() => setQuoteDetailShop(null)}
        />
      ) : null}

      {lightboxImg ? (
        <ImageLightbox src={lightboxImg.src} alt={lightboxImg.alt} onClose={() => setLightboxImg(null)} />
      ) : null}
    </section>
  )
}
