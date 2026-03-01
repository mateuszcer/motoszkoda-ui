import type { NotificationPageResponse, NotificationResponse, UnreadCountResponse } from '../domain/apiTypes'
import { api } from './apiClient'

export async function fetchNotifications(limit = 20, before?: string): Promise<NotificationPageResponse> {
  return api.get<NotificationPageResponse>('/api/notifications', {
    params: { limit, before },
  })
}

export async function fetchUnreadCount(): Promise<number> {
  const result = await api.get<UnreadCountResponse>('/api/notifications/unread-count')
  return result.count
}

export async function markRead(notificationId: string): Promise<NotificationResponse> {
  return api.patch<NotificationResponse>(`/api/notifications/${notificationId}/read`)
}

export async function markAllRead(): Promise<void> {
  await api.patch<void>('/api/notifications/read-all')
}
