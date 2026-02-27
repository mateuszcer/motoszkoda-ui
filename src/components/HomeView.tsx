import { useTranslation } from 'react-i18next'
import type { RepairRequest } from '../domain/types'
import { formatDateTime } from '../utils/format'

interface HomeViewProps {
  requests: RepairRequest[]
  onCreateRequest: () => void
  onMyRequests: () => void
  onOpenRequest?: (requestId: string) => void
}

export function HomeView({ requests, onCreateRequest, onMyRequests, onOpenRequest }: HomeViewProps) {
  const { t, i18n } = useTranslation()
  const openRequests = requests.filter((request) => request.status === 'open')
  const closedCount = requests.length - openRequests.length
  const previewRequests = openRequests.slice(0, 3)

  return (
    <section className="screen home-screen">
      <header className="hero-card">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1>{t('home.headline')}</h1>
        <p>
          {t('home.subheadline')}
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={onCreateRequest}>
            {t('home.createRequest')}
          </button>
          <button className="btn btn-secondary" onClick={onMyRequests}>
            {t('home.myRequests')}
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">{t('home.statOpen')}</span>
          <strong>{openRequests.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">{t('home.statClosed')}</span>
          <strong>{closedCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">{t('home.statTotal')}</span>
          <strong>{requests.length}</strong>
        </article>
      </div>

      {previewRequests.length > 0 ? (
        <div className="home-active-requests">
          <h2>{t('home.activeRequests')}</h2>
          <div className="cards-stack">
            {previewRequests.map((request) => {
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
                    <span className="pill pill-open">{t('status.open')}</span>
                    {quoteCount > 0 ? (
                      <span className="meta-item">{t('home.quoteCount', { count: quoteCount })}</span>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
