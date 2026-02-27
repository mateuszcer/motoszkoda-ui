import type {
  NotificationEvent,
  RepairRequest,
  RepairRequestApi,
  SendMessagePayload,
  ShopThread,
} from '../domain/types'
import {
  createDriverMessage,
  createRequestFromPayload,
  createShopMessage,
  deepCloneRequests,
  initialMockRequests,
  nextTimestamp,
} from '../mocks/mockData'

const latencyMs = 250

const requestsDb = deepCloneRequests(initialMockRequests)

const simulateLatency = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => {
    window.setTimeout(resolve, latencyMs)
  })
  return value
}

const getRequestIndex = (requestId: string): number => {
  return requestsDb.findIndex((request) => request.id === requestId)
}

const cloneRequest = (request: RepairRequest): RepairRequest => {
  return JSON.parse(JSON.stringify(request)) as RepairRequest
}

const sortByUpdateDesc = (items: RepairRequest[]): RepairRequest[] => {
  return [...items].sort((a, b) => {
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  })
}

const ensureThread = (
  request: RepairRequest,
  shopId: string,
  shopName: string,
): ShopThread => {
  const existing = request.threads[shopId]
  if (existing) {
    return existing
  }

  const created: ShopThread = {
    shopId,
    shopName,
    unreadCount: 0,
    messages: [],
    lastActivityAt: nextTimestamp(),
  }
  request.threads[shopId] = created
  return created
}

const updateRequestInDb = (requestIndex: number, request: RepairRequest): void => {
  requestsDb[requestIndex] = request
}

const questionTemplates = [
  'Czy może Pan przesłać jedno zdjęcie z bliska uszkodzonego miejsca?',
  'Czy problem występuje cały czas, czy tylko po dłuższej jeździe?',
  'Czy hałas jest bardziej słyszalny przy niskiej, czy wysokiej prędkości?',
]

const sampleQuotes = [
  { minPricePln: 420, maxPricePln: 560, durationDays: 1 },
  { minPricePln: 600, maxPricePln: 780, durationDays: 2 },
  { minPricePln: 320, maxPricePln: 490, durationDays: 1 },
]

const createNotification = (
  requestId: string,
  type: NotificationEvent['type'],
  title: string,
  message: string,
  shopId?: string,
): NotificationEvent => ({
  id: `notif_${Math.random().toString(36).slice(2, 10)}`,
  requestId,
  shopId,
  type,
  title,
  message,
  createdAt: nextTimestamp(),
})

const api: RepairRequestApi = {
  listRequests: async () => {
    return simulateLatency(sortByUpdateDesc(deepCloneRequests(requestsDb)))
  },

  getRequestById: async (requestId) => {
    const item = requestsDb.find((request) => request.id === requestId)
    return simulateLatency(item ? cloneRequest(item) : null)
  },

  createRequest: async (payload) => {
    const created = createRequestFromPayload(payload)
    requestsDb.unshift(created)
    return simulateLatency(cloneRequest(created))
  },

  closeRequest: async (requestId) => {
    const requestIndex = getRequestIndex(requestId)
    if (requestIndex < 0) {
      throw new Error('Request not found')
    }

    const request = cloneRequest(requestsDb[requestIndex])
    request.status = 'closed'
    request.updatedAt = nextTimestamp()

    updateRequestInDb(requestIndex, request)
    return simulateLatency(cloneRequest(request))
  },

  markInterested: async (requestId, shopId) => {
    const requestIndex = getRequestIndex(requestId)
    if (requestIndex < 0) {
      throw new Error('Request not found')
    }

    const request = cloneRequest(requestsDb[requestIndex])
    if (request.status === 'closed') {
      return simulateLatency(cloneRequest(request))
    }

    request.shopQuotes = request.shopQuotes.map((shopQuote) => {
      if (shopQuote.shopId !== shopId) {
        return shopQuote
      }

      return {
        ...shopQuote,
        interested: true,
        ignored: false,
        lastUpdatedAt: nextTimestamp(),
      }
    })

    request.updatedAt = nextTimestamp()
    updateRequestInDb(requestIndex, request)
    return simulateLatency(cloneRequest(request))
  },

  ignoreShop: async (requestId, shopId) => {
    const requestIndex = getRequestIndex(requestId)
    if (requestIndex < 0) {
      throw new Error('Request not found')
    }

    const request = cloneRequest(requestsDb[requestIndex])
    if (request.status === 'closed') {
      return simulateLatency(cloneRequest(request))
    }

    request.shopQuotes = request.shopQuotes.map((shopQuote) => {
      if (shopQuote.shopId !== shopId) {
        return shopQuote
      }

      return {
        ...shopQuote,
        ignored: true,
        interested: false,
        lastUpdatedAt: nextTimestamp(),
      }
    })

    request.updatedAt = nextTimestamp()
    updateRequestInDb(requestIndex, request)
    return simulateLatency(cloneRequest(request))
  },

  sendThreadMessage: async ({ requestId, shopId, text, attachments }: SendMessagePayload) => {
    const requestIndex = getRequestIndex(requestId)
    if (requestIndex < 0) {
      throw new Error('Request not found')
    }

    const request = cloneRequest(requestsDb[requestIndex])
    const quote = request.shopQuotes.find((entry) => entry.shopId === shopId)
    if (!quote) {
      throw new Error('Shop not found')
    }

    const thread = ensureThread(request, shopId, quote.shopName)
    thread.messages.push(createDriverMessage(text, attachments))
    thread.unreadCount = 0
    thread.lastActivityAt = nextTimestamp()

    if (request.status === 'open' && quote.state === 'question_sent') {
      quote.state = 'acknowledged'
      quote.questionPreview = undefined
      quote.lastUpdatedAt = nextTimestamp()
      thread.messages.push(createShopMessage('Dziękujemy, to nam pomoże. Przygotowujemy wycenę.'))
      thread.lastActivityAt = nextTimestamp()
    }

    request.updatedAt = nextTimestamp()

    updateRequestInDb(requestIndex, request)
    return simulateLatency(cloneRequest(request))
  },

  advanceMockUpdates: async (requestId) => {
    const requestIndex = getRequestIndex(requestId)
    if (requestIndex < 0) {
      throw new Error('Request not found')
    }

    const request = cloneRequest(requestsDb[requestIndex])
    if (request.status === 'closed') {
      return simulateLatency(null)
    }

    const candidate = request.shopQuotes
      .filter((shop) => !shop.ignored)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .find((shop) => {
        if (shop.state === 'delivered' || shop.state === 'acknowledged') {
          return true
        }
        if (shop.state === 'question_sent') {
          const thread = request.threads[shop.shopId]
          return (thread?.unreadCount ?? 0) === 0
        }
        return false
      })

    if (!candidate) {
      return simulateLatency(null)
    }

    let notification: NotificationEvent | null = null

    if (candidate.state === 'delivered') {
      candidate.state = 'acknowledged'
      candidate.lastUpdatedAt = nextTimestamp()
      notification = createNotification(
        request.id,
        'shop_acknowledged',
        'Warsztat potwierdził',
        `${candidate.shopName} przegląda Twoje zgłoszenie.`,
        candidate.shopId,
      )
    } else if (candidate.state === 'acknowledged') {
      const shopHash = candidate.shopName.length + candidate.shopId.length
      const sendQuestion = shopHash % 2 === 0 || !candidate.quote

      if (sendQuestion) {
        const question = questionTemplates[shopHash % questionTemplates.length]
        candidate.state = 'question_sent'
        candidate.questionPreview = question
        candidate.lastUpdatedAt = nextTimestamp()

        const thread = ensureThread(request, candidate.shopId, candidate.shopName)
        thread.messages.push(createShopMessage(question))
        thread.unreadCount += 1
        thread.lastActivityAt = nextTimestamp()

        notification = createNotification(
          request.id,
          'new_question',
          'Nowe pytanie od warsztatu',
          `${candidate.shopName}: ${question}`,
          candidate.shopId,
        )
      } else {
        const sample = sampleQuotes[shopHash % sampleQuotes.length]
        candidate.state = 'quote_sent'
        candidate.quote = {
          minPricePln: sample.minPricePln,
          maxPricePln: sample.maxPricePln,
          comment: 'Części w cenie. Ostateczna kwota zależy od oględzin.',
          durationDays: sample.durationDays,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
        candidate.phone = '+48 500 555 900'
        candidate.lastUpdatedAt = nextTimestamp()

        const thread = ensureThread(request, candidate.shopId, candidate.shopName)
        thread.messages.push(
          createShopMessage(
            `Wysłaliśmy wycenę: ${sample.minPricePln}–${sample.maxPricePln} PLN.`,
          ),
        )
        thread.lastActivityAt = nextTimestamp()

        notification = createNotification(
          request.id,
          'new_quote',
          'Nowa wycena',
          `${candidate.shopName} przesłał nową wycenę.`,
          candidate.shopId,
        )
      }
    } else if (candidate.state === 'question_sent') {
      const sample = sampleQuotes[candidate.shopId.length % sampleQuotes.length]
      candidate.state = 'quote_sent'
      candidate.quote = {
        minPricePln: sample.minPricePln,
        maxPricePln: sample.maxPricePln,
        comment: 'Wycena przygotowana po analizie Twojej odpowiedzi.',
        durationDays: sample.durationDays,
      }
      candidate.phone = '+48 500 555 120'
      candidate.questionPreview = undefined
      candidate.lastUpdatedAt = nextTimestamp()

      const thread = ensureThread(request, candidate.shopId, candidate.shopName)
      thread.messages.push(createShopMessage('Dziękujemy za szczegóły. Wycena została wysłana.'))
      thread.lastActivityAt = nextTimestamp()

      notification = createNotification(
        request.id,
        'new_quote',
        'Nowa wycena',
        `${candidate.shopName} przesłał wycenę po Twojej odpowiedzi.`,
        candidate.shopId,
      )
    }

    if (!notification) {
      return simulateLatency(null)
    }

    request.updatedAt = nextTimestamp()
    updateRequestInDb(requestIndex, request)

    return simulateLatency(notification)
  },
}

export const repairRequestApi: RepairRequestApi = api
