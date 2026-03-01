import type {
  AttachmentResponse,
  ApiTargetType,
  DownloadUrlResponse,
  UploadUrlRequest,
  UploadUrlResponse,
} from '../domain/apiTypes'
import { api } from './apiClient'

export async function requestUploadUrl(req: UploadUrlRequest): Promise<UploadUrlResponse> {
  return api.post<UploadUrlResponse>('/api/attachments/upload-url', { body: req })
}

export async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
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
