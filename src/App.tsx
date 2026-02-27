import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { CreateRepairRequestFlow } from './components/CreateRepairRequestFlow'
import { HomeView } from './components/HomeView'
import { MyRequestsView } from './components/MyRequestsView'
import { RepairRequestDetail } from './components/RepairRequestDetail'
import type {
  AppScreen,
  Attachment,
  CreateRepairRequestPayload,
  NotificationEvent,
  RepairRequest,
} from './domain/types'
import { repairRequestApi } from './services/repairRequestApi'

const sortRequests = (requests: RepairRequest[]): RepairRequest[] => {
  return [...requests].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

function LanguageToggle() {
  const { i18n } = useTranslation()
  const isPolish = i18n.language.startsWith('pl')

  return (
    <button
      className="btn btn-ghost lang-toggle"
      onClick={() => {
        void i18n.changeLanguage(isPolish ? 'en' : 'pl')
      }}
    >
      {isPolish ? 'EN' : 'PL'}
    </button>
  )
}

function App() {
  const { t } = useTranslation()
  const [screen, setScreen] = useState<AppScreen>('home')
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banners, setBanners] = useState<NotificationEvent[]>([])

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) {
      return null
    }

    return requests.find((request) => request.id === selectedRequestId) ?? null
  }, [requests, selectedRequestId])

  const pushBanner = useCallback((event: NotificationEvent) => {
    setBanners((previous) => [event, ...previous].slice(0, 4))

    window.setTimeout(() => {
      setBanners((previous) => previous.filter((entry) => entry.id !== event.id))
    }, 6000)
  }, [])

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await repairRequestApi.listRequests()
      setRequests(sortRequests(list))
    } catch {
      setError('app.loadError')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  const upsertRequest = useCallback((updatedRequest: RepairRequest) => {
    setRequests((previous) => {
      const withoutCurrent = previous.filter((request) => request.id !== updatedRequest.id)
      return sortRequests([...withoutCurrent, updatedRequest])
    })
  }, [])

  const openRequestDetail = async (requestId: string) => {
    setSelectedRequestId(requestId)
    setScreen('request-detail')

    const existing = requests.find((request) => request.id === requestId)
    if (existing) {
      return
    }

    const loaded = await repairRequestApi.getRequestById(requestId)
    if (loaded) {
      upsertRequest(loaded)
    }
  }

  const handleCreateRequest = async (payload: CreateRepairRequestPayload): Promise<RepairRequest> => {
    const created = await repairRequestApi.createRequest(payload)
    upsertRequest(created)
    pushBanner({
      id: `notif_${Date.now().toString(36)}`,
      requestId: created.id,
      type: 'request_submitted',
      title: t('notification.requestSubmittedTitle'),
      message: t('notification.requestSubmittedMessage'),
      createdAt: new Date().toISOString(),
    })

    return created
  }

  const handleCloseRequest = async (requestId: string) => {
    const updated = await repairRequestApi.closeRequest(requestId)
    upsertRequest(updated)
  }

  const handleMarkInterested = async (requestId: string, shopId: string) => {
    const updated = await repairRequestApi.markInterested(requestId, shopId)
    upsertRequest(updated)
  }

  const handleIgnoreShop = async (requestId: string, shopId: string) => {
    const updated = await repairRequestApi.ignoreShop(requestId, shopId)
    upsertRequest(updated)
  }

  const handleSendThreadMessage = async (
    requestId: string,
    shopId: string,
    text: string,
    attachments: Attachment[],
  ) => {
    const updated = await repairRequestApi.sendThreadMessage({
      requestId,
      shopId,
      text,
      attachments,
    })
    upsertRequest(updated)
  }

  useEffect(() => {
    if (screen !== 'request-detail' || !selectedRequestId) {
      return
    }

    const activeRequest = requests.find((request) => request.id === selectedRequestId)
    if (!activeRequest || activeRequest.status === 'closed') {
      return
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        const event = await repairRequestApi.advanceMockUpdates(selectedRequestId)
        if (!event) {
          return
        }

        const updated = await repairRequestApi.getRequestById(selectedRequestId)
        if (updated) {
          upsertRequest(updated)
        }

        pushBanner(event)
      })()
    }, 20_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [pushBanner, requests, screen, selectedRequestId, upsertRequest])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand" onClick={() => setScreen('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-mark">MS</div>
          <h1>Moto Szkoda</h1>
        </div>
        <div className="header-actions">
          {screen !== 'home' ? (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setScreen('home')
              }}
            >
              {t('app.home')}
            </button>
          ) : null}
          <LanguageToggle />
        </div>
      </header>

      <section className="banner-stack" aria-live="polite">
        {banners.map((banner) => (
          <article className={`banner banner-${banner.type}`} key={banner.id}>
            <strong>{banner.title}</strong>
            <p>{banner.message}</p>
          </article>
        ))}
      </section>

      {loading ? <p className="loading">{t('app.loading')}</p> : null}
      {error ? <p className="field-error">{t(error)}</p> : null}

      {!loading && !error && screen === 'home' ? (
        <HomeView
          requests={requests}
          onCreateRequest={() => {
            setScreen('create-request')
          }}
          onMyRequests={() => {
            setScreen('my-requests')
          }}
          onOpenRequest={(requestId) => {
            void openRequestDetail(requestId)
          }}
        />
      ) : null}

      {!loading && !error && screen === 'create-request' ? (
        <CreateRepairRequestFlow
          onCancel={() => {
            setScreen('home')
          }}
          onSubmitRequest={handleCreateRequest}
          onViewRequest={(requestId) => {
            void openRequestDetail(requestId)
          }}
        />
      ) : null}

      {!loading && !error && screen === 'my-requests' ? (
        <MyRequestsView
          requests={requests}
          onBackHome={() => {
            setScreen('home')
          }}
          onOpenRequest={(requestId) => {
            void openRequestDetail(requestId)
          }}
        />
      ) : null}

      {!loading && !error && screen === 'request-detail' && selectedRequest ? (
        <RepairRequestDetail
          request={selectedRequest}
          onBackHome={() => {
            setScreen('home')
          }}
          onMyRequests={() => {
            setScreen('my-requests')
          }}
          onCloseRequest={handleCloseRequest}
          onMarkInterested={handleMarkInterested}
          onIgnoreShop={handleIgnoreShop}
          onSendThreadMessage={handleSendThreadMessage}
        />
      ) : null}

      {!loading && !error && screen === 'request-detail' && !selectedRequest ? (
        <article className="empty-state">{t('app.notFound')}</article>
      ) : null}
    </main>
  )
}

export default App
