import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RepairRequest } from '../domain/types'
import { formatDateTime } from '../utils/format'

interface MyRequestsViewProps {
  requests: RepairRequest[]
  onBackHome: () => void
  onOpenRequest: (requestId: string) => void
}

type FilterValue = 'all' | 'open' | 'closed'

export const MyRequestsView = memo(function MyRequestsView(props: MyRequestsViewProps) {
  const { requests, onBackHome, onOpenRequest } = props
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<FilterValue>('all')

  const openRequests = useMemo(() => requests.filter((r) => r.status === 'open'), [requests])
  const closedRequests = useMemo(() => requests.filter((r) => r.status === 'closed'), [requests])

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return requests
    }

    return requests.filter((request) => request.status === filter)
  }, [filter, requests])

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

  const tabCounts: Record<FilterValue, number> = {
    all: requests.length,
    open: openRequests.length,
    closed: closedRequests.length,
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('myRequests.title')}</h1>
        </div>
        <button className="btn btn-secondary" onClick={onBackHome}>
          {t('common.back')}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <nav className="tabs-nav" role="tablist">
            {(['all', 'open', 'closed'] as FilterValue[]).map((value) => (
              <button
                key={value}
                className={`tab-item ${filter === value ? 'tab-item-active' : ''}`}
                role="tab"
                onClick={() => setFilter(value)}
              >
                {value === 'all' ? t('myRequests.filterAll') : t(`status.${value}`)}
                <span className="tab-count">{tabCounts[value]}</span>
              </button>
            ))}
          </nav>
        </div>

        {filtered.length > 0 ? (
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
                {filtered.map((request) => {
                  const quoteCount = request.shopQuotes.filter((shop) => shop.state === 'quote_sent').length
                  const questionCount = request.shopQuotes.filter((shop) => shop.state === 'question_sent').length

                  return (
                    <tr
                      key={request.id}
                      onClick={() => onOpenRequest(request.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onOpenRequest(request.id)
                      }}
                      tabIndex={0}
                    >
                      <td>
                        <div className="u-flex" style={{ alignItems: 'center', gap: '10px' }}>
                          <span className="vehicle-icon">{request.car.make.charAt(0)}</span>
                          <span>
                            {request.car.make} {request.car.model}
                          </span>
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
                          <span className="quote-count">{t('myRequests.quoteCount', { count: quoteCount })}</span>
                          {questionCount > 0 ? (
                            <span className="pill pill-alert">
                              {t('myRequests.questionCount', { count: questionCount })}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{request.location.radiusKm} km</td>
                      <td>{formatDateTime(request.updatedAt, i18n.language)}</td>
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
