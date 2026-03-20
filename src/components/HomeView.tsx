import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Entitlements, UserPlanInfo } from '../domain/apiTypes'
import type { RepairRequest } from '../domain/types'
import { formatDateTime } from '../utils/format'
import { formatLimit } from '../utils/plan'

interface HomeViewProps {
  requests: RepairRequest[]
  onCreateRequest: () => void
  onMyRequests: () => void
  onOpenRequest?: (requestId: string) => void
  planInfo?: UserPlanInfo | null
  onNavigatePlan?: () => void
  freeEntitlements: Entitlements
}

type HomeTab = 'open' | 'closed' | 'all'

export const HomeView = memo(function HomeView(props: HomeViewProps) {
  const { requests, onCreateRequest, onMyRequests, onOpenRequest, planInfo, onNavigatePlan, freeEntitlements } = props
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<HomeTab>('open')

  const openRequests = useMemo(() => requests.filter((r) => r.status === 'open'), [requests])
  const closedRequests = useMemo(() => requests.filter((r) => r.status === 'closed'), [requests])
  const isFree = planInfo?.planCode === 'FREE'

  const filteredRequests = activeTab === 'open' ? openRequests : activeTab === 'closed' ? closedRequests : requests

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'badge badge-green'
      case 'closed':
        return 'badge badge-gray'
      default:
        return 'badge badge-gray'
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('sidebar.overview')}</h1>
          <p className="page-subtitle">{t('home.subheadline')}</p>
        </div>
        <div className="u-flex" style={{ gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onMyRequests}>
            {t('home.myRequests')}
          </button>
          <button className="btn btn-primary" onClick={onCreateRequest}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('home.createRequest')}
          </button>
        </div>
      </div>

      {isFree ? (
        <p className="usage-indicator">
          {t('plan.usageIndicator', {
            used: openRequests.length,
            max: formatLimit(freeEntitlements.maxOpenRepairRequests, t),
          })}
          {' · '}
          <button className="view-link" onClick={onNavigatePlan} type="button">
            {t('plan.freePlan')}
          </button>
        </p>
      ) : null}

      <div className="card">
        <div className="card-header">
          <nav className="tabs-nav" role="tablist" aria-label="Request filter">
            {(
              [
                ['open', openRequests.length],
                ['closed', closedRequests.length],
                ['all', requests.length],
              ] as const
            ).map(([tab, count]) => (
              <button
                key={tab}
                className={`tab-item ${activeTab === tab ? 'tab-item-active' : ''}`}
                role="tab"
                onClick={() => setActiveTab(tab as HomeTab)}
              >
                {t(`home.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}` as string)}
                <span className="tab-count">{count}</span>
              </button>
            ))}
          </nav>
        </div>

        {filteredRequests.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('home.colVehicle')}</th>
                  <th>{t('home.colStatus')}</th>
                  <th>{t('home.colQuotes')}</th>
                  <th>{t('home.colRange')}</th>
                  <th>{t('home.colUpdated')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const quoteCount = request.shopQuotes.filter((s) => s.state === 'quote_sent').length
                  const questionCount = request.shopQuotes.filter((s) => s.state === 'question_sent').length
                  return (
                    <tr
                      key={request.id}
                      onClick={() => onOpenRequest?.(request.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onOpenRequest?.(request.id)
                      }}
                      tabIndex={0}
                    >
                      <td>
                        <div className="u-flex" style={{ alignItems: 'center', gap: '10px' }}>
                          <span className="vehicle-icon">{request.car.make.charAt(0)}</span>
                          <div>
                            <div className="vehicle-name">
                              {request.car.make} {request.car.model}
                            </div>
                            {request.issue.description ? (
                              <div className="vehicle-desc">{request.issue.description}</div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={statusBadgeClass(request.status)}>
                          <span className="badge-dot" />
                          {t(`status.${request.status}`)}
                        </span>
                      </td>
                      <td>
                        <div
                          className="u-flex"
                          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}
                        >
                          <span className={quoteCount > 0 ? 'quote-count' : ''}>
                            {t('home.quoteCount', { count: quoteCount })}
                          </span>
                          {questionCount > 0 ? (
                            <span className="pill pill-alert">{t('home.questionCount', { count: questionCount })}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="u-text-muted" style={{ fontSize: 12 }}>
                        {request.location.radiusKm} km
                      </td>
                      <td className="u-text-muted" style={{ fontSize: 12 }}>
                        {formatDateTime(request.updatedAt, i18n.language)}
                      </td>
                      <td>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M6 4l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">{t('myRequests.noRequests')}</div>
        )}
      </div>
    </section>
  )
})
