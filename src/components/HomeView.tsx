import { useTranslation } from 'react-i18next'
import type { RepairRequest } from '../domain/types'
import { formatDateTime } from '../utils/format'

interface HomeViewProps {
  requests: RepairRequest[]
  onCreateRequest: () => void
  onMyRequests: () => void
  onOpenRequest?: (requestId: string) => void
}

const CarSilhouette = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 75h-6a6 6 0 01-6-6v-8l10-14h30l16 14h20l10 8v6a6 6 0 01-6 6h-6M20 75a6 6 0 1012 0M68 75a6 6 0 1012 0M32 75h36"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M38 47l4-8h20l4 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
  </svg>
)

export function HomeView({ requests, onCreateRequest, onMyRequests, onOpenRequest }: HomeViewProps) {
  const { t, i18n } = useTranslation()
  const openRequests = requests.filter((request) => request.status === 'open')
  const closedCount = requests.length - openRequests.length
  const previewRequests = openRequests.slice(0, 3)

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
            <button className="btn btn-secondary" onClick={onMyRequests}>
              {t('home.myRequests')}
            </button>
          </div>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <CarSilhouette />
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-item">
          <span className="stat-number">{openRequests.length}</span>
          <span className="stat-label">{t('home.statOpen')}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{closedCount}</span>
          <span className="stat-label">{t('home.statClosed')}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{requests.length}</span>
          <span className="stat-label">{t('home.statTotal')}</span>
        </div>
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
