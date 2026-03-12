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

  const CONCURRENCY = 3
  let completed = 0

  // Process uploads in concurrent batches
  for (let i = 0; i < toUpload.length; i += CONCURRENCY) {
    const batch = toUpload.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.allSettled(
      batch.map(async (att) => {
        const file = files.get(att.id)!
        const { attachmentId, uploadUrl, contentType } = await requestUploadUrl({
          targetType,
          repairRequestId,
          fileName: att.name,
          contentType: file.type as UploadUrlRequest['contentType'],
          sizeBytes: file.size,
          shopId,
        })
        await uploadFile(uploadUrl, file, contentType)
        return confirmUpload(attachmentId)
      }),
    )

    for (let j = 0; j < batchResults.length; j++) {
      completed++
      onProgress?.(completed, total)
      const settled = batchResults[j]
      if (settled.status === 'fulfilled') {
        result.successes.push(settled.value)
      } else {
        result.errors.push({ attachmentId: batch[j].id, error: settled.reason })
      }
    }
  }

  return result
}
