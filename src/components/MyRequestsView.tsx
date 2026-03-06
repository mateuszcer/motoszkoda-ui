import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RepairRequest } from '../domain/types'
import { formatDateTime } from '../utils/format'

interface MyRequestsViewProps {
  requests: RepairRequest[]
  onBackHome: () => void
  onOpenRequest: (requestId: string) => void
}

type FilterValue = 'all' | 'open' | 'closed'

export function MyRequestsView({ requests, onBackHome, onOpenRequest }: MyRequestsViewProps) {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<FilterValue>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return requests
    }

    return requests.filter((request) => request.status === filter)
  }, [filter, requests])

  return (
    <section className="screen">
      <div className="section-header">
        <button className="btn btn-ghost" onClick={onBackHome}>
          {t('common.back')}
        </button>
        <h2 className="section-title">{t('myRequests.title')}</h2>
        <div />
      </div>

      <div className="sort-chips">
        {(['all', 'open', 'closed'] as FilterValue[]).map((value) => (
          <button
            key={value}
            className={`chip ${filter === value ? 'chip-active' : ''}`}
            onClick={() => {
              setFilter(value)
            }}
          >
            {value === 'all' ? t('myRequests.filterAll') : t(`status.${value}`)}
          </button>
        ))}
      </div>

      <div className="cards-stack">
        {filtered.length === 0 ? (
          <article className="empty-state">{t('myRequests.noRequests')}</article>
        ) : null}

        {filtered.map((request) => {
          const quoteCount = request.shopQuotes.filter((shop) => shop.state === 'quote_sent').length
          const questionCount = request.shopQuotes.filter((shop) => shop.state === 'question_sent').length

          return (
            <article
              className="request-card"
              key={request.id}
              onClick={() => {
                onOpenRequest(request.id)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onOpenRequest(request.id)
              }}
            >
              <div>
                <h3>
                  {request.car.make} {request.car.model}
                  {request.car.variant ? ` ${request.car.variant}` : ''}
                </h3>
                <p>{request.issue.description}</p>
                <small>{t('myRequests.updated', { date: formatDateTime(request.updatedAt, i18n.language) })}</small>
              </div>

              <div className="request-meta">
                <span className={`pill pill-${request.status}`}>{t(`status.${request.status}`)}</span>
                {quoteCount > 0 ? (
                  <span className="meta-item">{t('myRequests.quoteCount', { count: quoteCount })}</span>
                ) : null}
                {questionCount > 0 ? (
                  <span className="pill pill-alert">{t('myRequests.questionCount', { count: questionCount })}</span>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
