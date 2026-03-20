import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageLightbox } from './ImageLightbox'
import { PhoneInput } from './PhoneInput'
import type { RepairRequest, ShopOwnResponse, ThreadMessage } from '../domain/types'
import { getDownloadUrl } from '../services/attachmentApi'
import { formatCurrencyPln, formatDateTime, formatLineItemRange } from '../utils/format'

interface ShopRequestDetailViewProps {
  request: RepairRequest
  shopResponse: ShopOwnResponse | null
  messages: ThreadMessage[]
  initialTab?: DetailTab
  onBack: () => void
  onAcknowledge: () => void
  onDecline: () => void
  onSendQuote: () => void
  onAskQuestion: (text: string) => Promise<void>
  onSendMessage: (text: string) => Promise<void>
  onSharePhone: (phone: string) => Promise<void>
}

type DetailTab = 'details' | 'messages'

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'badge badge-blue'
    case 'ACKNOWLEDGED':
      return 'badge badge-amber'
    case 'QUOTED':
      return 'badge badge-green'
    case 'DECLINED':
      return 'badge badge-red'
    default:
      return 'badge badge-gray'
  }
}

function statusDescKey(status: string, isClosed: boolean): string {
  if (isClosed) return 'shopDetail.statusDescClosed'
  switch (status) {
    case 'PENDING':
      return 'shopDetail.statusDescPending'
    case 'ACKNOWLEDGED':
      return 'shopDetail.statusDescAcknowledged'
    case 'QUOTED':
      return 'shopDetail.statusDescQuoted'
    case 'DECLINED':
      return 'shopDetail.statusDescDeclined'
    default:
      return 'shopDetail.statusDescClosed'
  }
}

export function ShopRequestDetailView({
  request,
  shopResponse,
  messages,
  initialTab = 'details',
  onBack,
  onAcknowledge,
  onDecline,
  onSendQuote,
  onAskQuestion,
  onSendMessage,
  onSharePhone,
}: ShopRequestDetailViewProps) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [ackLoading, setAckLoading] = useState(false)
  const [declineLoading, setDeclineLoading] = useState(false)
  const [messageDraft, setMessageDraft] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [phoneDraft, setPhoneDraft] = useState('')
  const [sharingPhone, setSharingPhone] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isClosed = request.status === 'closed'
  const status = shopResponse?.status ?? 'PENDING'
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({})
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null)

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

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab, request.id])

  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, activeTab])

  const handleAcknowledge = async () => {
    setAckLoading(true)
    try {
      onAcknowledge()
    } finally {
      setAckLoading(false)
    }
  }

  const handleDeclineConfirm = async () => {
    setDeclineLoading(true)
    try {
      onDecline()
      setShowDeclineDialog(false)
    } finally {
      setDeclineLoading(false)
    }
  }

  const handleSendMessage = async () => {
    const text = messageDraft.trim()
    if (!text) return
    setSendingMessage(true)
    try {
      if (status === 'PENDING' || status === 'ACKNOWLEDGED') {
        await onAskQuestion(text)
      } else {
        await onSendMessage(text)
      }
      setMessageDraft('')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSharePhone = async () => {
    if (!phoneDraft.trim()) return
    setSharingPhone(true)
    try {
      await onSharePhone(phoneDraft.trim())
      setPhoneDraft('')
    } finally {
      setSharingPhone(false)
    }
  }

  return (
    <section className="screen shop-detail-screen">
      <button className="btn btn-ghost back-btn" onClick={onBack}>
        {t('common.back')}
      </button>

      <div className="shop-detail-grid">
        {/* Left column */}
        <div className="shop-detail-left">
          {/* Vehicle header — standalone, no card */}
          <div className="sd-vehicle-header">
            <span className="vehicle-icon vehicle-icon-lg">
              {request.car.make.charAt(0)}
              {request.car.model.charAt(0)}
            </span>
            <div className="u-flex-1">
              <h2 className="page-title">
                {request.car.make} {request.car.model} ({request.car.year})
              </h2>
              <div className="page-subtitle">
                {request.issue.description} · {t('shopDetail.radius', { radius: request.location.radiusKm })}
              </div>
            </div>
            <span className={`${statusBadgeClass(status)} badge-lg`}>
              <span className="badge-dot" />
              {t(`shopRequestStatus.${status}`)}
            </span>
          </div>

          {isClosed ? <div className="status-banner status-banner-warning">{t('shopDetail.requestClosed')}</div> : null}

          {/* Quote card — QUOTED status only */}
          {status === 'QUOTED' && !isClosed ? (
            <div className="card">
              <div className="card-header">
                <span className="card-header-title">{t('shopDetail.quoteSent')}</span>
                <button className="btn btn-secondary btn-sm" onClick={onSendQuote}>
                  {t('shopDetail.editQuote')}
                </button>
              </div>
              <div className="card-body">
                {shopResponse?.quotes.map((q, i) => (
                  <div key={i}>
                    <div className="u-flex u-items-center" style={{ gap: 8, marginBottom: 16 }}>
                      <span className="sd-quote-price">
                        {formatCurrencyPln(q.minPricePln, i18n.language)}
                        {q.maxPricePln ? ` – ${formatCurrencyPln(q.maxPricePln, i18n.language)}` : ''}
                      </span>
                      {q.durationDays ? (
                        <span className="sd-quote-duration">
                          · {t('detail.durationDays', { count: q.durationDays })}
                        </span>
                      ) : null}
                    </div>
                    {q.lineItems && q.lineItems.length > 0 ? (
                      <div className="bordered-table" style={{ marginBottom: 16 }}>
                        {q.lineItems.map((li, idx) => (
                          <div className="bordered-table-row" key={li.id ?? idx}>
                            <span>{li.description}</span>
                            <span>{formatLineItemRange(li, i18n.language)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {shopResponse?.sharedPhone ? (
                  <div className="sd-phone-info">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--teal-600)"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                    </svg>
                    <span>
                      {t('shopDetail.phoneShared', { phone: '' })}
                      <span className="sd-phone-number">{shopResponse.sharedPhone}</span>
                    </span>
                  </div>
                ) : (
                  <div className="phone-share-row">
                    <PhoneInput
                      value={phoneDraft}
                      onChange={setPhoneDraft}
                      placeholder={t('shopDetail.phonePlaceholder')}
                    />
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => void handleSharePhone()}
                      disabled={sharingPhone || !phoneDraft.trim()}
                    >
                      {sharingPhone ? t('shopDetail.sharing') : t('shopDetail.sharePhone')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Tabbed card: Details / Messages */}
          <div className="card">
            <div className="card-header">
              <nav className="tabs-nav">
                <button
                  className={`tab-item ${activeTab === 'details' ? 'tab-item-active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  {t('shopDetail.tabDetails')}
                </button>
                <button
                  className={`tab-item ${activeTab === 'messages' ? 'tab-item-active' : ''}`}
                  onClick={() => setActiveTab('messages')}
                >
                  {t('shopDetail.tabMessages')}
                  <span className="tab-count">{messages.length}</span>
                </button>
              </nav>
            </div>

            {activeTab === 'details' ? (
              <div className="shop-detail-tab-content">
                <div className="detail-section">
                  <div className="sd-overline">{t('shopDetail.issueTitle')}</div>
                  <div className="sd-issue-box">{request.issue.description}</div>
                </div>

                {request.issue.tags.length > 0 ? (
                  <div className="detail-section">
                    <div className="sd-overline">{t('shopDetail.categoriesTitle')}</div>
                    <div className="u-flex" style={{ gap: 6, flexWrap: 'wrap' }}>
                      {request.issue.tags.map((tag) => (
                        <span className="cat-pill" key={tag}>
                          {t(`tags.${tag}`, tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="detail-section">
                  <div className="sd-overline">{t('shopDetail.carTitle')}</div>
                  <div className="bordered-table">
                    <div className="bordered-table-row">
                      <span>{t('form.make')}</span>
                      <span>{request.car.make}</span>
                    </div>
                    <div className="bordered-table-row">
                      <span>{t('form.model')}</span>
                      <span>{request.car.model}</span>
                    </div>
                    <div className="bordered-table-row">
                      <span>{t('form.year')}</span>
                      <span>{request.car.year}</span>
                    </div>
                    {request.car.variant ? (
                      <div className="bordered-table-row">
                        <span>{t('form.variant')}</span>
                        <span>{request.car.variant}</span>
                      </div>
                    ) : null}
                    {request.car.vin ? (
                      <div className="bordered-table-row">
                        <span>{t('form.vin')}</span>
                        <span className="sd-vin">{request.car.vin}</span>
                      </div>
                    ) : null}
                    {request.car.engineType ? (
                      <div className="bordered-table-row">
                        <span>{t('form.engineType')}</span>
                        <span>{request.car.engineType}</span>
                      </div>
                    ) : null}
                    {request.car.fuelType ? (
                      <div className="bordered-table-row">
                        <span>{t('form.fuelType')}</span>
                        <span>{request.car.fuelType}</span>
                      </div>
                    ) : null}
                    {request.car.mileageKm ? (
                      <div className="bordered-table-row">
                        <span>{t('form.mileageKm')}</span>
                        <span>{request.car.mileageKm.toLocaleString()} km</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'messages' ? (
              <div className="shop-messages-content">
                <div className="thread-messages">
                  {messages.length === 0 ? <p className="empty-state">{t('shopDetail.noMessages')}</p> : null}
                  {messages.map((msg) => (
                    <div className={`shop-msg-row shop-msg-row-${msg.author}`} key={msg.id}>
                      <span className="avatar">{msg.author === 'self' ? 'W' : 'K'}</span>
                      <article className={`thread-message thread-message-${msg.author}`}>
                        <p>{msg.text}</p>
                        <small>{formatDateTime(msg.sentAt, i18n.language)}</small>
                      </article>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {!isClosed && status !== 'DECLINED' ? (
                  <div className="thread-composer">
                    <textarea
                      placeholder={
                        status === 'PENDING' || status === 'ACKNOWLEDGED'
                          ? t('shopDetail.questionPlaceholder')
                          : t('shopDetail.messagePlaceholder')
                      }
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void handleSendMessage()
                        }
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => void handleSendMessage()}
                      disabled={sendingMessage || !messageDraft.trim()}
                    >
                      {sendingMessage
                        ? t('thread.sending')
                        : status === 'PENDING' || status === 'ACKNOWLEDGED'
                          ? t('shopDetail.askQuestion')
                          : t('thread.send')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right column */}
        <div className="shop-detail-right">
          {/* Status card */}
          <div className="card">
            <div className="card-header">
              <div className="sd-overline" style={{ margin: 0 }}>
                {t('shopDetail.orderStatus')}
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 16 }}>
                <span className={`${statusBadgeClass(status)} badge-lg`}>
                  <span className="badge-dot" />
                  {t(`shopRequestStatus.${status}`)}
                </span>
              </div>
              <div className="sd-status-desc">{t(statusDescKey(status, isClosed))}</div>
              {!isClosed ? (
                <>
                  {status === 'PENDING' || status === 'ACKNOWLEDGED' ? (
                    <div className="sd-status-actions">
                      <button className="btn btn-primary" onClick={onSendQuote}>
                        {t('shopDetail.sendQuote')}
                      </button>
                      <button className="btn btn-danger-outline" onClick={() => setShowDeclineDialog(true)}>
                        {t('shopDetail.decline')}
                      </button>
                      {status === 'PENDING' ? (
                        <button
                          className="btn btn-secondary"
                          onClick={() => void handleAcknowledge()}
                          disabled={ackLoading}
                        >
                          {ackLoading ? t('shopDetail.acknowledging') : t('shopDetail.acknowledge')}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {status === 'QUOTED' ? (
                    <div className="sd-status-actions">
                      <button className="btn btn-primary" onClick={() => setActiveTab('messages')}>
                        {t('shopDetail.writeMessage')}
                      </button>
                      {shopResponse?.sharedPhone ? (
                        <a className="btn btn-secondary" href={`tel:${shopResponse.sharedPhone}`}>
                          {t('shopDetail.callDriver')}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {/* Photos card */}
          <div className="card">
            <div className="card-header">
              <div className="sd-overline" style={{ margin: 0 }}>
                {t('shopDetail.attachmentsTitle')}
              </div>
            </div>
            <div className="card-body">
              {request.issue.attachments.length > 0 ? (
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
              ) : (
                <div className="sd-photos-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>{t('shopDetail.noPhotosShort')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location card */}
          <div className="card">
            <div className="card-header">
              <div className="sd-overline" style={{ margin: 0 }}>
                {t('shopDetail.locationTitle')}
              </div>
            </div>
            <div className="card-body">
              <div className="sd-map-placeholder">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ marginRight: 6 }}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="u-text-muted" style={{ fontSize: 13 }}>
                {t('shopDetail.distance', { radius: request.location.radiusKm })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decline confirmation dialog */}
      {showDeclineDialog ? (
        <div className="dialog-backdrop" onClick={() => setShowDeclineDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('shopDetail.declineDialogTitle')}</h3>
            <p>{t('shopDetail.declineDialogMessage')}</p>
            <div className="dialog-actions">
              <button className="btn btn-ghost" onClick={() => setShowDeclineDialog(false)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-danger-outline"
                onClick={() => void handleDeclineConfirm()}
                disabled={declineLoading}
              >
                {declineLoading ? t('shopDetail.declining') : t('shopDetail.confirmDecline')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {lightboxImg ? (
        <ImageLightbox src={lightboxImg.src} alt={lightboxImg.alt} onClose={() => setLightboxImg(null)} />
      ) : null}
    </section>
  )
}
