import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Attachment } from '../domain/types'
import { formatBytes } from '../utils/attachments'

interface AttachmentGridProps {
  attachments: Attachment[]
  removable?: boolean
  onRemove?: (attachmentId: string) => void
}

export const AttachmentGrid = memo(function AttachmentGrid({
  attachments,
  removable = false,
  onRemove,
}: AttachmentGridProps) {
  const { t } = useTranslation()

  if (!attachments.length) {
    return null
  }

  return (
    <div className="attachment-grid">
      {attachments.map((attachment) => (
        <figure className="attachment-card" key={attachment.id}>
          {attachment.kind === 'image' && attachment.previewUrl ? (
            <img src={attachment.previewUrl} alt={attachment.name} />
          ) : (
            <div className="attachment-fallback">
              <span>{attachment.kind === 'video' ? t('attachment.video') : t('attachment.document')}</span>
            </div>
          )}
          <figcaption>
            <p>{attachment.name}</p>
            <small>{formatBytes(attachment.sizeBytes)}</small>
          </figcaption>
          {removable && onRemove ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                onRemove(attachment.id)
              }}
            >
              {t('common.remove')}
            </button>
          ) : null}
        </figure>
      ))}
    </div>
  )
})
