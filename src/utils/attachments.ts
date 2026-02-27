import type { Attachment, AttachmentKind } from '../domain/types'

const randomId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `att_${Math.random().toString(36).slice(2, 10)}`
}

export const getAttachmentKind = (mimeType: string): AttachmentKind => {
  if (mimeType.startsWith('image/')) {
    return 'image'
  }

  if (mimeType.startsWith('video/')) {
    return 'video'
  }

  return 'document'
}

export const fileToAttachment = (file: File): Attachment => {
  const kind = getAttachmentKind(file.type)

  return {
    id: randomId(),
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    kind,
    previewUrl: kind === 'image' ? URL.createObjectURL(file) : undefined,
  }
}

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(1)} MB`
}

export const revokeAttachmentPreview = (attachment: Attachment): void => {
  if (attachment.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl)
  }
}

export const revokeAttachmentsPreview = (attachments: Attachment[]): void => {
  attachments.forEach(revokeAttachmentPreview)
}
