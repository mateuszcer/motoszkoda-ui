import { useCallback, useState } from 'react'
import type {
  RepairRequest,
  SharePhonePayload,
  ShopOwnResponse,
  ShopProfile,
  ShopQueueItem,
  SubmitQuotePayload,
  ThreadMessage,
  UpdateShopProfilePayload,
} from '../domain/types'
import { shopApi } from '../services/shopApi'

export function useShopPortal(userId: string | null) {
  const [shopQueue, setShopQueue] = useState<ShopQueueItem[]>([])
  const [shopSelectedRequest, setShopSelectedRequest] = useState<RepairRequest | null>(null)
  const [shopOwnResponse, setShopOwnResponse] = useState<ShopOwnResponse | null>(null)
  const [shopMessages, setShopMessages] = useState<ThreadMessage[]>([])
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null)
  const [shopLoading, setShopLoading] = useState(false)
  const [shopError, setShopError] = useState<string | null>(null)

  const loadShopQueue = useCallback(async () => {
    setShopLoading(true)
    setShopError(null)
    try {
      // Use the shopId from profile if available, otherwise load profile first
      let resolvedShopId = shopProfile?.shopId
      if (!resolvedShopId) {
        try {
          const profile = await shopApi.fetchProfile()
          setShopProfile(profile)
          resolvedShopId = profile.shopId
        } catch {
          // Profile doesn't exist yet — empty queue
          setShopQueue([])
          setShopLoading(false)
          return
        }
      }
      const items = await shopApi.fetchQueue(resolvedShopId)
      setShopQueue(items)
    } catch {
      setShopError('app.loadError')
    } finally {
      setShopLoading(false)
    }
  }, [shopProfile?.shopId])

  const openShopRequestDetail = useCallback(
    async (requestId: string) => {
      setShopLoading(true)
      setShopError(null)
      try {
        const [request, ownResponse] = await Promise.all([
          shopApi.fetchRequestDetail(requestId),
          shopApi.fetchOwnResponse(requestId),
        ])
        setShopSelectedRequest(request)
        setShopOwnResponse(ownResponse)

        // Load messages — shop endpoint derives shopId from JWT
        if (userId) {
          try {
            const msgs = await shopApi.fetchMessages(requestId, userId)
            setShopMessages(msgs)
          } catch {
            setShopMessages([])
          }
        } else {
          setShopMessages([])
        }
      } catch {
        setShopError('app.loadError')
      } finally {
        setShopLoading(false)
      }
    },
    [userId],
  )

  const handleShopAcknowledge = useCallback(
    async (requestId: string) => {
      await shopApi.acknowledge(requestId)
      await loadShopQueue()
    },
    [loadShopQueue],
  )

  const handleShopDecline = useCallback(
    async (requestId: string) => {
      await shopApi.decline(requestId)
      await loadShopQueue()
    },
    [loadShopQueue],
  )

  const handleSubmitQuote = useCallback(
    async (requestId: string, payload: SubmitQuotePayload, phone?: string) => {
      await shopApi.submitQuote(requestId, payload)
      if (phone) {
        await shopApi.sharePhone(requestId, { phone } satisfies SharePhonePayload)
      }
      await openShopRequestDetail(requestId)
    },
    [openShopRequestDetail],
  )

  const handleSharePhone = useCallback(
    async (requestId: string, phone: string) => {
      await shopApi.sharePhone(requestId, { phone })
      await openShopRequestDetail(requestId)
    },
    [openShopRequestDetail],
  )

  const handleShopAskQuestion = useCallback(
    async (requestId: string, text: string) => {
      await shopApi.sendQuestion(requestId, text)
      if (userId) {
        const msgs = await shopApi.fetchMessages(requestId, userId)
        setShopMessages(msgs)
      }
    },
    [userId],
  )

  const handleShopSendMessage = useCallback(
    async (requestId: string, text: string) => {
      if (!userId) return
      await shopApi.sendQuestion(requestId, text)
      const msgs = await shopApi.fetchMessages(requestId, userId)
      setShopMessages(msgs)
    },
    [userId],
  )

  const loadShopProfile = useCallback(async () => {
    try {
      const profile = await shopApi.fetchProfile()
      setShopProfile(profile)
    } catch {
      // Profile may not exist yet
    }
  }, [])

  const handleSaveProfile = useCallback(async (payload: UpdateShopProfilePayload) => {
    const updated = await shopApi.updateProfile(payload)
    setShopProfile(updated)
  }, [])

  return {
    shopQueue,
    shopSelectedRequest,
    shopOwnResponse,
    shopMessages,
    shopProfile,
    shopLoading,
    shopError,
    loadShopQueue,
    openShopRequestDetail,
    handleShopAcknowledge,
    handleShopDecline,
    handleSubmitQuote,
    handleSharePhone,
    handleShopAskQuestion,
    handleShopSendMessage,
    loadShopProfile,
    handleSaveProfile,
  }
}
