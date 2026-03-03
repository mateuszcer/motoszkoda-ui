import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RepairRequest, ShopOwnResponse, ThreadMessage } from '../domain/types'
import { getDownloadUrl } from '../services/attachmentApi'
import { formatCurrencyPln, formatDateTime, formatLineItemRange } from '../utils/format'

interface ShopRequestDetailViewProps {
  request: RepairRequest
  shopResponse: ShopOwnResponse | null
  messages: ThreadMessage[]
  onBack: () => void
  onAcknowledge: () => void
  onDecline: () => void
  onSendQuote: () => void
  onAskQuestion: (text: string) => Promise<void>
  onSendMessage: (text: string) => Promise<void>
  onSharePhone: (phone: string) => Promise<void>
}

type DetailTab = 'details' | 'messages'

export function ShopRequestDetailView({
  request,
  shopResponse,
  messages,
  onBack,
  onAcknowledge,
  onDecline,
  onSendQuote,
  onAskQuestion,
  onSendMessage,
  onSharePhone,
}: ShopRequestDetailViewProps) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<DetailTab>('details')
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

      {/* Car details header */}
      <header className="shop-detail-header">
        <div>
          <h2>
            {request.car.make} {request.car.model} ({request.car.year})
          </h2>
          {request.car.variant ? <p className="variant">{request.car.variant}</p> : null}
          <div className="shop-detail-meta">
            <span>{t('shopDetail.radius', { radius: request.location.radiusKm })}</span>
            <span>{formatDateTime(request.createdAt, i18n.language)}</span>
          </div>
        </div>
        <span className={`pill pill-shop-${status === 'PENDING' ? 'new' : status === 'ACKNOWLEDGED' ? 'in_progress' : status === 'QUOTED' ? 'quoted' : 'declined'}`}>
          {t(`shopRequestStatus.${status}`)}
        </span>
      </header>

      {/* System banner for closed/expired */}
      {isClosed ? (
        <div className="status-banner status-banner-warning">
          {t('shopDetail.requestClosed')}
        </div>
      ) : null}

      {/* Action bar */}
      {!isClosed ? (
        <div className="shop-action-bar">
          {(status === 'PENDING') ? (
            <>
              <button className="btn btn-primary" onClick={() => void handleAcknowledge()} disabled={ackLoading}>
                {ackLoading ? t('shopDetail.acknowledging') : t('shopDetail.acknowledge')}
              </button>
              <button className="btn btn-secondary" onClick={onSendQuote}>
                {t('shopDetail.sendQuote')}
              </button>
              <button className="btn btn-ghost btn-danger" onClick={() => setShowDeclineDialog(true)}>
                {t('shopDetail.decline')}
              </button>
            </>
          ) : null}
          {status === 'ACKNOWLEDGED' ? (
            <>
              <button className="btn btn-primary" onClick={onSendQuote}>
                {t('shopDetail.sendQuote')}
              </button>
              <button className="btn btn-ghost btn-danger" onClick={() => setShowDeclineDialog(true)}>
                {t('shopDetail.decline')}
              </button>
            </>
          ) : null}
          {status === 'QUOTED' ? (
            <div className="shop-quote-summary">
              <h4>{t('shopDetail.quoteSent')}</h4>
              {shopResponse?.quotes.map((q, i) => (
                <div key={i}>
                  <p>
                    {formatCurrencyPln(q.minPricePln, i18n.language)}
                    {q.maxPricePln ? ` – ${formatCurrencyPln(q.maxPricePln, i18n.language)}` : ''}
                    {q.durationDays ? ` · ${t('detail.durationDays', { count: q.durationDays })}` : ''}
                  </p>
                  {q.lineItems && q.lineItems.length > 0 ? (
                    <div className="quote-line-items-display">
                      {q.lineItems.map((li, idx) => (
                        <div className="quote-line-item-row" key={li.id ?? idx}>
                          <span>{li.description}</span>
                          <span>{formatLineItemRange(li, i18n.language)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {!shopResponse?.sharedPhone ? (
                <div className="phone-share-row">
                  <input
                    type="tel"
                    placeholder={t('shopDetail.phonePlaceholder')}
                    value={phoneDraft}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => void handleSharePhone()}
                    disabled={sharingPhone || !phoneDraft.trim()}
                  >
                    {sharingPhone ? t('shopDetail.sharing') : t('shopDetail.sharePhone')}
                  </button>
                </div>
              ) : (
                <p className="phone-shared">{t('shopDetail.phoneShared', { phone: shopResponse.sharedPhone })}</p>
              )}
            </div>
          ) : null}
          {status === 'DECLINED' ? (
            <div className="status-banner status-banner-muted">
              {t('shopDetail.declinedLabel')}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          {t('shopDetail.tabDetails')}
        </button>
        <button
          className={`tab ${activeTab === 'messages' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          {t('shopDetail.tabMessages')} ({messages.length})
        </button>
      </div>

      {/* Details tab */}
      {activeTab === 'details' ? (
        <div className="shop-detail-content">
          <div className="detail-section">
            <h3>{t('shopDetail.issueTitle')}</h3>
            <p>{request.issue.description}</p>
          </div>

          {request.issue.tags.length > 0 ? (
            <div className="detail-section">
              <h3>{t('shopDetail.categoriesTitle')}</h3>
              <div className="tags-inline">
                {request.issue.tags.map((tag) => (
                  <span className="pill pill-tag" key={tag}>{t(`tags.${tag}`, tag)}</span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="detail-section">
            <h3>{t('shopDetail.carTitle')}</h3>
            <dl className="detail-grid">
              <dt>{t('form.make')}</dt><dd>{request.car.make}</dd>
              <dt>{t('form.model')}</dt><dd>{request.car.model}</dd>
              <dt>{t('form.year')}</dt><dd>{request.car.year}</dd>
              {request.car.variant ? <><dt>{t('form.variant')}</dt><dd>{request.car.variant}</dd></> : null}
              {request.car.vin ? <><dt>{t('form.vin')}</dt><dd>{request.car.vin}</dd></> : null}
              {request.car.engineType ? <><dt>{t('form.engineType')}</dt><dd>{request.car.engineType}</dd></> : null}
              {request.car.fuelType ? <><dt>{t('form.fuelType')}</dt><dd>{request.car.fuelType}</dd></> : null}
              {request.car.mileageKm ? <><dt>{t('form.mileageKm')}</dt><dd>{request.car.mileageKm.toLocaleString()} km</dd></> : null}
            </dl>
          </div>

          {request.issue.attachments.length > 0 ? (
            <div className="detail-section">
              <h3>{t('shopDetail.attachmentsTitle')}</h3>
              <div className="attachment-grid">
                {request.issue.attachments.map((att) => {
                  const url = att.previewUrl ?? attachmentUrls[att.id]
                  return (
                    <div className="attachment-thumb" key={att.id}>
                      {url ? <img src={url} alt={att.name} /> : <span>{att.name}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Messages tab */}
      {activeTab === 'messages' ? (
        <div className="shop-messages-content">
          <div className="thread-messages">
            {messages.length === 0 ? (
              <p className="empty-state">{t('shopDetail.noMessages')}</p>
            ) : null}
            {messages.map((msg) => (
              <article
                className={`thread-message thread-message-${msg.author}`}
                key={msg.id}
              >
                <p>{msg.text}</p>
                <small>{formatDateTime(msg.sentAt, i18n.language)}</small>
              </article>
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
                {sendingMessage ? t('thread.sending') : (
                  status === 'PENDING' || status === 'ACKNOWLEDGED'
                    ? t('shopDetail.askQuestion')
                    : t('thread.send')
                )}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

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
                className="btn btn-primary btn-danger"
                onClick={() => void handleDeclineConfirm()}
                disabled={declineLoading}
              >
                {declineLoading ? t('shopDetail.declining') : t('shopDetail.confirmDecline')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
