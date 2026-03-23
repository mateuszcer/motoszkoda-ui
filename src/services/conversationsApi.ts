import type { ApiSenderRole, ConversationPageResponse } from '../domain/apiTypes'
import { mapConversationItem } from '../domain/mappers'
import type { ConversationSummary } from '../domain/types'
import { api } from './apiClient'

export interface ConversationPage {
  items: ConversationSummary[]
  totalUnreadCount: number
  hasMore: boolean
  nextCursor: string | null
}

export async function fetchConversations(
  viewerRole: ApiSenderRole,
  limit = 20,
  before?: string,
): Promise<ConversationPage> {
  const raw = await api.get<ConversationPageResponse>('/api/conversations', {
    params: { limit, before },
  })
  return {
    items: raw.items.map((item) => mapConversationItem(item, viewerRole)),
    totalUnreadCount: raw.totalUnreadCount,
    hasMore: raw.hasMore,
    nextCursor: raw.nextCursor,
  }
}
