import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ShopQueueItem } from '../domain/types'
import { formatDateTime } from '../utils/format'

interface ShopMessagesViewProps {
  queueItems: ShopQueueItem[]
  onOpenRequest: (requestId: string) => void
}

export function ShopMessagesView({ queueItems, onOpenRequest }: ShopMessagesViewProps) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')

  const conversations = useMemo(() => {
    const filtered = queueItems
      .filter((item) => item.hasMessages)
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))

    if (!search.trim()) {
      return filtered
    }

    const query = search.trim().toLowerCase()
    return filtered.filter(
      (item) =>
        item.make.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query),
    )
  }, [queueItems, search])

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('messages.title')}</h1>
          <p className="page-subtitle">{t('shopInbox.subheadline')}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: 'var(--space-4)' }}>
          <input
            className="form-input"
            type="text"
            placeholder={t('messages.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {conversations.length === 0 ? (
          <div className="empty-state">{t('messages.noConversations')}</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('form.vehicle')}</th>
                  <th>{t('shopDetail.issueTitle')}</th>
                  <th>{t('shopInbox.statusCol')}</th>
                  <th>{t('shopInbox.dateCol')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {conversations.map((item) => (
                  <tr
                    key={item.repairRequestId}
                    onClick={() => onOpenRequest(item.repairRequestId)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onOpenRequest(item.repairRequestId)
                    }}
                  >
                    <td>
                      <div className="u-flex u-items-center" style={{ gap: 10 }}>
                        <span className="vehicle-icon">
                          {item.make.charAt(0)}
                          {item.model.charAt(0)}
                        </span>
                        <div>
                          <div className="vehicle-name">
                            {item.make} {item.model}
                          </div>
                          <div className="vehicle-desc">
                            {t('shopInbox.kmAway', { distance: item.distanceKm.toFixed(1) })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{item.description.length > 80 ? `${item.description.slice(0, 80)}...` : item.description}</td>
                    <td>
                      <span className="badge badge-amber">
                        <span className="badge-dot" />
                        {t('sidebar.messages')}
                      </span>
                    </td>
                    <td>{formatDateTime(item.lastActivityAt, i18n.language)}</td>
                    <td>
                      <button
                        className="view-link"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenRequest(item.repairRequestId)
                        }}
                        type="button"
                      >
                        {t('messages.viewRequest')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
