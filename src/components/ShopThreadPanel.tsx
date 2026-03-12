import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Attachment, ShopThread } from '../domain/types'
import { fileToAttachment, revokeAttachmentPreview, revokeAttachmentsPreview } from '../utils/attachments'
import { formatDateTime } from '../utils/format'
import { AttachmentGrid } from './AttachmentGrid'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_ATTACHMENTS = 5

interface ShopThreadPanelProps {
  thread: ShopThread
  readOnly: boolean
  onClose: () => void
  onSend: (text: string, attachments: Attachment[], files: Map<string, File>) => Promise<void>
}

export function ShopThreadPanel({ thread, readOnly, onClose, onSend }: ShopThreadPanelProps) {
  const { t, i18n } = useTranslation()
  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileMapRef = useRef<Map<string, File>>(new Map())

  useEffect(() => {
    return () => {
      revokeAttachmentsPreview(attachments)
    }
  }, [attachments])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.messages.length])

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    fileMapRef.current.delete(attachmentId)
    setAttachments((previous) => {
      const target = previous.find((attachment) => attachment.id === attachmentId)
      if (target) {
        revokeAttachmentPreview(target)
      }
      return previous.filter((attachment) => attachment.id !== attachmentId)
    })
  }, [])

  const handleSend = async () => {
    const cleanDraft = draft.trim()
    if (!cleanDraft && attachments.length === 0) {
      return
    }

    setSending(true)
    try {
      await onSend(cleanDraft, attachments, fileMapRef.current)
      setDraft('')
      setAttachments([])
      fileMapRef.current = new Map()
    } finally {
      setSending(false)
    }
  }

  const hasNeedsAnswer = thread.messages.length > 0 && thread.messages[thread.messages.length - 1].author === 'shop'

  return (
    <aside className="thread-panel-backdrop" role="presentation" onClick={onClose}>
      <section
        className="thread-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Q&A with ${thread.shopName}`}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <header className="thread-header">
          <div>
            <p className="eyebrow">{t('thread.eyebrow')}</p>
            <h3>{thread.shopName}</h3>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="thread-messages">
          {hasNeedsAnswer && !readOnly ? <div className="thread-needs-answer">{t('thread.needsAnswer')}</div> : null}

          {thread.messages.map((message) => (
            <article className={`thread-message thread-message-${message.author}`} key={message.id}>
              <p>{message.text}</p>
              {message.attachments.length > 0 ? <AttachmentGrid attachments={message.attachments} /> : null}
              <small>{formatDateTime(message.sentAt, i18n.language)}</small>
            </article>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <footer className="thread-composer">
          {readOnly ? (
            <p className="read-only-note">{t('thread.readOnly')}</p>
          ) : (
            <>
              <textarea
                placeholder={t('thread.placeholder')}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleSend()
                  }
                }}
              />
              {hasNeedsAnswer ? (
                <div className="quick-reply-chips">
                  {(['quickReplyPhoto', 'quickReplySymptoms', 'quickReplyDontKnow'] as const).map((key) => (
                    <button
                      key={key}
                      className="chip"
                      type="button"
                      onClick={() => setDraft((prev) => (prev ? `${prev} ${t(`thread.${key}`)}` : t(`thread.${key}`)))}
                    >
                      {t(`thread.${key}`)}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="composer-actions">
                <label className="btn btn-ghost file-input-btn" htmlFor="thread-attachment-input">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </label>
                <input
                  id="thread-attachment-input"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const files = event.target.files
                    if (!files) {
                      return
                    }

                    setAttachmentError(null)
                    const remaining = MAX_ATTACHMENTS - attachments.length
                    if (remaining <= 0) {
                      setAttachmentError('form.maxAttachments')
                      event.target.value = ''
                      return
                    }

                    const validFiles: File[] = []
                    for (const file of Array.from(files)) {
                      if (!ALLOWED_MIME_TYPES.has(file.type)) {
                        setAttachmentError('form.fileTypeNotAllowed')
                        continue
                      }
                      if (file.size > MAX_FILE_SIZE) {
                        setAttachmentError('form.fileTooLarge')
                        continue
                      }
                      if (validFiles.length >= remaining) {
                        setAttachmentError('form.maxAttachments')
                        break
                      }
                      validFiles.push(file)
                    }

                    const added = validFiles.map((file) => {
                      const attachment = fileToAttachment(file)
                      fileMapRef.current.set(attachment.id, file)
                      return attachment
                    })
                    setAttachments((previous) => [...previous, ...added])
                    event.target.value = ''
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => void handleSend()}
                  disabled={sending || (!draft.trim() && attachments.length === 0)}
                >
                  {sending ? t('thread.sending') : t('thread.send')}
                </button>
              </div>
              {attachmentError ? <small className="field-error">{t(attachmentError)}</small> : null}
              <AttachmentGrid attachments={attachments} removable onRemove={handleRemoveAttachment} />
            </>
          )}
        </footer>
      </section>
    </aside>
  )
}
