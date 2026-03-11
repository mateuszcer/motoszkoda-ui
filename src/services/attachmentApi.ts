import type {
  AttachmentResponse,
  ApiTargetType,
  DownloadUrlResponse,
  UploadUrlRequest,
  UploadUrlResponse,
} from '../domain/apiTypes'
import type { Attachment } from '../domain/types'
import { api } from './apiClient'

export async function requestUploadUrl(req: UploadUrlRequest): Promise<UploadUrlResponse> {
  return api.post<UploadUrlResponse>('/api/attachments/upload-url', { body: req })
}

export async function uploadFile(uploadUrl: string, file: File, contentType: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }
}

export async function confirmUpload(attachmentId: string): Promise<AttachmentResponse> {
  return api.post<AttachmentResponse>(`/api/attachments/${attachmentId}/confirm`)
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  await api.delete<void>(`/api/attachments/${attachmentId}`)
}

export async function getDownloadUrl(attachmentId: string): Promise<string> {
  const result = await api.get<DownloadUrlResponse>(`/api/attachments/${attachmentId}/download-url`)
  return result.downloadUrl
}

export async function listAttachments(
  targetType: ApiTargetType,
  repairRequestId: string,
  shopId?: string,
): Promise<AttachmentResponse[]> {
  return api.get<AttachmentResponse[]>('/api/attachments', {
    params: { targetType, repairRequestId, shopId },
  })
}

export interface UploadResult {
  successes: AttachmentResponse[]
  errors: Array<{ attachmentId: string; error: unknown }>
}

export async function uploadAttachments(
  files: Map<string, File>,
  attachments: Attachment[],
  targetType: ApiTargetType,
  repairRequestId: string,
  shopId?: string,
  onProgress?: (current: number, total: number) => void,
): Promise<UploadResult> {
  const result: UploadResult = { successes: [], errors: [] }
  const toUpload = attachments.filter((att) => files.has(att.id))
  const total = toUpload.length

  for (let i = 0; i < toUpload.length; i++) {
    const att = toUpload[i]
    const file = files.get(att.id)!
    onProgress?.(i + 1, total)

    try {
      const { attachmentId, uploadUrl, contentType } = await requestUploadUrl({
        targetType,
        repairRequestId,
        fileName: att.name,
        contentType: file.type as UploadUrlRequest['contentType'],
        sizeBytes: file.size,
        shopId,
      })
      await uploadFile(uploadUrl, file, contentType)
      const confirmed = await confirmUpload(attachmentId)
      result.successes.push(confirmed)
    } catch (error) {
      result.errors.push({ attachmentId: att.id, error })
    }
  }

  return result
}
