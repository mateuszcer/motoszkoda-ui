import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { UserPlanInfo } from '../domain/apiTypes'
import type { RepairRequest } from '../domain/types'
import { FREE_LIMITS } from '../hooks/usePlan'
import { formatDateTime } from '../utils/format'

interface HomeViewProps {
  requests: RepairRequest[]
  onCreateRequest: () => void
  onMyRequests: () => void
  onOpenRequest?: (requestId: string) => void
  planInfo?: UserPlanInfo | null
  onNavigatePlan?: () => void
}

type HomeTab = 'open' | 'closed' | 'all'

export function HomeView({ requests, onCreateRequest, onMyRequests, onOpenRequest, planInfo, onNavigatePlan }: HomeViewProps) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<HomeTab>('open')

  const openRequests = requests.filter((r) => r.status === 'open')
  const closedRequests = requests.filter((r) => r.status === 'closed')
  const isFree = planInfo?.planCode === 'FREE'
  const atOpenLimit = isFree && openRequests.length >= FREE_LIMITS.maxOpen

  const filteredRequests =
    activeTab === 'open' ? openRequests
    : activeTab === 'closed' ? closedRequests
    : requests

  return (
    <section className="screen home-screen">
      <header className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('home.headline')}</h1>
          <p>{t('home.subheadline')}</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={onCreateRequest}>
              {t('home.createRequest')}
            </button>
            <button className="btn btn-ghost" onClick={onMyRequests}>
              {t('home.myRequests')}
            </button>
          </div>
        </div>
      </header>

      <div className="tab-strip home-tabs" role="tablist" aria-label="Request filter">
        {([
          ['open', openRequests.length],
          ['closed', closedRequests.length],
          ['all', requests.length],
        ] as const).map(([tab, count]) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'tab-btn-active' : ''}`}
            role="tab"
            onClick={() => setActiveTab(tab as HomeTab)}
          >
            {t(`home.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}` as string, { count })}
          </button>
        ))}
      </div>

      {isFree ? (
        <p className="usage-indicator">
          {t('plan.usageIndicator', { used: openRequests.length, max: FREE_LIMITS.maxOpen })}
          {' · '}
          <a className="usage-indicator-link" onClick={onNavigatePlan}>
            {atOpenLimit ? t('plan.increaseLimit') : t('plan.freePlan')}
          </a>
        </p>
      ) : null}

      {filteredRequests.length > 0 ? (
        <div className="cards-stack">
          {filteredRequests.map((request) => {
            const quoteCount = request.shopQuotes.filter((s) => s.state === 'quote_sent').length
            return (
              <article
                className="request-card"
                key={request.id}
                onClick={() => onOpenRequest?.(request.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onOpenRequest?.(request.id)
                }}
              >
                <div>
                  <h3>
                    {request.car.make} {request.car.model} {request.car.variant}
                  </h3>
                  <p>{request.issue.description}</p>
                  <small>{t('home.updated', { date: formatDateTime(request.updatedAt, i18n.language) })}</small>
                </div>
                <div className="request-meta">
                  <span className={`pill pill-${request.status}`}>{t(`status.${request.status}`)}</span>
                  {quoteCount > 0 ? (
                    <span className="meta-item">{t('home.quoteCount', { count: quoteCount })}</span>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <article className="empty-state">{t('myRequests.noRequests')}</article>
      )}
    </section>
  )
}
