import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiSenderRole } from '../domain/apiTypes'
import type { ConversationSummary } from '../domain/types'
import { fetchConversations } from '../services/conversationsApi'

interface UseConversationsResult {
  conversations: ConversationSummary[]
  totalUnreadCount: number
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

export function useConversations(viewerRole: ApiSenderRole): UseConversationsResult {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const nextCursorRef = useRef<string | null>(null)

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchConversations(viewerRole)
      setConversations(page.items)
      setTotalUnreadCount(page.totalUnreadCount)
      setHasMore(page.hasMore)
      nextCursorRef.current = page.nextCursor
    } catch {
      setError('messages.loadError')
    } finally {
      setLoading(false)
    }
  }, [viewerRole])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !nextCursorRef.current) return
    setLoadingMore(true)
    void fetchConversations(viewerRole, 20, nextCursorRef.current)
      .then((page) => {
        setConversations((prev) => [...prev, ...page.items])
        setTotalUnreadCount(page.totalUnreadCount)
        setHasMore(page.hasMore)
        nextCursorRef.current = page.nextCursor
      })
      .catch(() => {
        // Silently fail on load-more; user can retry
      })
      .finally(() => {
        setLoadingMore(false)
      })
  }, [viewerRole, loadingMore, hasMore])

  const refresh = useCallback(() => {
    void loadInitial()
  }, [loadInitial])

  return {
    conversations,
    totalUnreadCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  }
}
