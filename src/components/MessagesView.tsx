import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RepairRequest, ShopThread, ThreadMessage } from '../domain/types'
import { formatDateTime } from '../utils/format'

interface MessagesViewProps {
  requests: RepairRequest[]
  userName: string
  onOpenRequest: (requestId: string) => void
  onSendMessage: (requestId: string, shopId: string, text: string) => Promise<void>
}

interface Conversation {
  requestId: string
  shopId: string
  shopName: string
  carLabel: string
  issueTag: string
  issueDescription: string
  thread: ShopThread
  lastMessage: ThreadMessage | null
}

export function MessagesView({ requests, userName, onOpenRequest, onSendMessage }: MessagesViewProps) {
  const { t, i18n } = useTranslation()
  const [activeConvo, setActiveConvo] = useState<{ requestId: string; shopId: string } | null>(null)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const chatBodyRef = useRef<HTMLDivElement>(null)

  const userInitials = useMemo(() => {
    const parts = userName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return userName.slice(0, 2).toUpperCase()
  }, [userName])

  const conversations = useMemo(() => {
    const result: Conversation[] = []
    for (const request of requests) {
      for (const [shopId, thread] of Object.entries(request.threads)) {
        const lastMessage = thread.messages.length > 0 ? thread.messages[thread.messages.length - 1] : null
        result.push({
          requestId: request.id,
          shopId,
          shopName: thread.shopName,
          carLabel: `${request.car.make} ${request.car.model}`,
          issueTag: request.issue.tags[0] ?? '',
          issueDescription: request.issue.description,
          thread,
          lastMessage,
        })
      }
    }
    result.sort((a, b) => {
      const aTime = a.thread.lastActivityAt
      const bTime = b.thread.lastActivityAt
      return bTime.localeCompare(aTime)
    })
    return result
  }, [requests])

  const activeConversation = useMemo(() => {
    if (!activeConvo) return null
    return conversations.find((c) => c.requestId === activeConvo.requestId && c.shopId === activeConvo.shopId) ?? null
  }, [activeConvo, conversations])

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [activeConversation?.thread.messages.length])

  const handleSend = useCallback(async () => {
    if (!activeConvo || !messageText.trim() || sending) return
    setSending(true)
    try {
      await onSendMessage(activeConvo.requestId, activeConvo.shopId, messageText.trim())
      setMessageText('')
    } finally {
      setSending(false)
    }
  }, [activeConvo, messageText, sending, onSendMessage])

  const formatConvoTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) {
      return date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
    }
    if (isYesterday) {
      return t('messages.yesterday')
    }
    return date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })
  }

  const getDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) return t('messages.today')
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) return t('messages.yesterday')
    return formatDateTime(dateStr, i18n.language)
  }

  const isListHidden = activeConvo !== null
  const isChatHidden = activeConvo === null

  return (
    <div className="messages-layout">
      <div className={`messages-list ${isListHidden ? 'messages-list--hidden' : ''}`}>
        <div className="messages-list__search">
          <div className="messages-list__search-wrapper">
            <svg
              className="messages-list__search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input className="messages-list__search-input" placeholder={t('messages.searchPlaceholder')} />
          </div>
        </div>
        {conversations.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: '13px' }}>
            {t('messages.noConversations')}
          </div>
        ) : (
          conversations.map((convo) => {
            const isActive = activeConvo?.requestId === convo.requestId && activeConvo?.shopId === convo.shopId
            return (
              <div
                key={`${convo.requestId}-${convo.shopId}`}
                className={`messages-conversation ${isActive ? 'messages-conversation--active' : ''}`}
                onClick={() => setActiveConvo({ requestId: convo.requestId, shopId: convo.shopId })}
              >
                <div className="messages-conversation__row">
                  <span
                    className={`messages-conversation__avatar ${convo.thread.unreadCount > 0 ? 'messages-conversation__avatar--unread' : ''}`}
                  >
                    {convo.shopName.charAt(0)}
                  </span>
                  <div className="messages-conversation__info">
                    <div className="messages-conversation__header">
                      <span className="messages-conversation__name">{convo.shopName}</span>
                      <span className="messages-conversation__time">
                        {convo.lastMessage ? formatConvoTime(convo.lastMessage.sentAt) : ''}
                      </span>
                    </div>
                    <div className="messages-conversation__preview">{convo.lastMessage?.text ?? ''}</div>
                  </div>
                  {convo.thread.unreadCount > 0 ? <span className="messages-conversation__unread" /> : null}
                </div>
                <div className="messages-conversation__context">
                  <span className="badge badge-gray messages-conversation__context-badge">
                    {convo.issueTag ? `${convo.carLabel} · ${convo.issueTag}` : convo.carLabel}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className={`messages-chat ${isChatHidden ? 'messages-chat--hidden' : ''}`}>
        {activeConversation ? (
          <>
            <div className="messages-chat__header">
              <div className="messages-chat__header-info">
                <button
                  className="messages-chat__back btn-secondary"
                  onClick={() => setActiveConvo(null)}
                  aria-label={t('common.back')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M10 4l-4 4 4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <span className="messages-chat__header-avatar">{activeConversation.shopName.charAt(0)}</span>
                <div>
                  <div className="messages-chat__header-name">{activeConversation.shopName}</div>
                  <div className="messages-chat__header-context">
                    {activeConversation.issueDescription
                      ? `${activeConversation.carLabel} · ${activeConversation.issueDescription}`
                      : activeConversation.carLabel}
                  </div>
                </div>
              </div>
              <button className="view-link" onClick={() => onOpenRequest(activeConversation.requestId)}>
                {t('messages.viewRequest')}
              </button>
            </div>

            <div className="messages-chat__body" ref={chatBodyRef}>
              {activeConversation.thread.messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '13px', padding: '20px' }}>
                  {t('messages.noMessages')}
                </div>
              ) : (
                (() => {
                  let lastDateStr = ''
                  return activeConversation.thread.messages.map((msg) => {
                    const msgDate = new Date(msg.sentAt).toDateString()
                    const showSeparator = msgDate !== lastDateStr
                    lastDateStr = msgDate
                    const isSent = msg.author === 'self'

                    return (
                      <div key={msg.id}>
                        {showSeparator ? (
                          <div className="messages-chat__date-separator">{getDateSeparator(msg.sentAt)}</div>
                        ) : null}
                        <div className={`messages-chat__bubble-row ${isSent ? 'messages-chat__bubble-row--sent' : ''}`}>
                          {!isSent ? (
                            <span className="messages-chat__bubble-avatar messages-chat__bubble-avatar--received">
                              {activeConversation.shopName.charAt(0)}
                            </span>
                          ) : (
                            <span className="messages-chat__bubble-avatar messages-chat__bubble-avatar--sent">
                              {userInitials}
                            </span>
                          )}
                          <div>
                            <div
                              className={`messages-chat__bubble ${isSent ? 'messages-chat__bubble--sent' : 'messages-chat__bubble--received'}`}
                            >
                              {msg.text}
                            </div>
                            <div className="messages-chat__bubble-time">
                              {new Date(msg.sentAt).toLocaleTimeString(i18n.language, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()
              )}
            </div>

            <div className="messages-chat__composer">
              <input
                className="form-input messages-chat__composer-input"
                placeholder={t('messages.inputPlaceholder')}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
              />
              <button
                className="messages-chat__send-btn"
                onClick={() => void handleSend()}
                disabled={sending || !messageText.trim()}
                aria-label={t('messages.send')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: 'var(--gray-400)',
              fontSize: '13px',
            }}
          >
            {t('messages.noConversations')}
          </div>
        )}
      </div>
    </div>
  )
}
