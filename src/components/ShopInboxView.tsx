import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ShopInboxFilter, ShopQueueItem, ShopRequestStatus } from '../domain/types'
import { formatDateTime } from '../utils/format'

interface ShopInboxViewProps {
  queueItems: ShopQueueItem[]
  onOpenRequest: (requestId: string) => void
  onAcknowledge: (requestId: string) => void
  onDecline: (requestId: string) => void
  onProfile: () => void
}

const FILTERS: ShopInboxFilter[] = ['all', 'new', 'in_progress', 'quoted', 'declined']

function statusToFilter(status: ShopRequestStatus | null): ShopInboxFilter {
  switch (status) {
    case 'PENDING':
      return 'new'
    case 'ACKNOWLEDGED':
      return 'in_progress'
    case 'QUOTED':
      return 'quoted'
    case 'DECLINED':
      return 'declined'
    default:
      return 'new'
  }
}

function statusBadgeClass(status: ShopRequestStatus | null): string {
  switch (status) {
    case 'PENDING':
      return 'badge badge-blue'
    case 'ACKNOWLEDGED':
      return 'badge badge-amber'
    case 'QUOTED':
      return 'badge badge-green'
    case 'DECLINED':
      return 'badge badge-red'
    default:
      return 'badge badge-blue'
  }
}

export function ShopInboxView({ queueItems, onOpenRequest, onAcknowledge, onDecline }: ShopInboxViewProps) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<ShopInboxFilter>('all')
  const [search, setSearch] = useState('')

  const tabCounts = useMemo(() => {
    const counts: Record<ShopInboxFilter, number> = {
      all: queueItems.length,
      new: 0,
      in_progress: 0,
      quoted: 0,
      declined: 0,
    }
    for (const item of queueItems) {
      counts[statusToFilter(item.status)]++
    }
    return counts
  }, [queueItems])

  const filtered = useMemo(() => {
    const items = activeTab === 'all' ? queueItems : queueItems.filter((i) => statusToFilter(i.status) === activeTab)
    if (!search.trim()) {
      return items
    }

    const query = search.trim().toLowerCase()
    return items.filter(
      (item) =>
        item.make.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query),
    )
  }, [activeTab, queueItems, search])

  return (
    <section className="screen shop-inbox-screen">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('shopInbox.headline')}</h1>
          <p className="page-subtitle">{t('shopInbox.subheadline')}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <nav className="tabs-nav">
            {FILTERS.map((tab) => (
              <button
                key={tab}
                className={`tab-item ${activeTab === tab ? 'tab-item-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {t(`shopInbox.filter_${tab}`)}
                <span className="tab-count">{tabCounts[tab]}</span>
              </button>
            ))}
          </nav>
        </div>

        <div style={{ padding: 'var(--space-4)' }}>
          <input
            className="form-input"
            type="text"
            placeholder={t('shopInbox.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">{t('shopInbox.noItems')}</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('form.vehicle')}</th>
                  <th>{t('shopDetail.issueTitle')}</th>
                  <th>{t('shopInbox.distance')}</th>
                  <th>{t('shopInbox.statusCol')}</th>
                  <th>{t('shopInbox.dateCol')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const displayStatus = item.status ?? 'PENDING'
                  return (
                    <tr key={item.repairRequestId} onClick={() => onOpenRequest(item.repairRequestId)}>
                      <td>
                        <div className="u-flex u-items-center" style={{ gap: 10 }}>
                          <span className="vehicle-icon">
                            {item.make.charAt(0)}
                            {item.model.charAt(0)}
                          </span>
                          <span>
                            {item.make} {item.model}
                          </span>
                        </div>
                      </td>
                      <td>
                        {item.categories.length > 0 ? (
                          <span className="badge badge-gray">
                            {t(`tags.${item.categories[0]}`, item.categories[0])}
                          </span>
                        ) : null}
                        <span className="u-text-muted" style={{ marginLeft: item.categories.length > 0 ? 8 : 0 }}>
                          {item.description.length > 60 ? `${item.description.slice(0, 60)}...` : item.description}
                        </span>
                      </td>
                      <td>{t('shopInbox.kmAway', { distance: item.distanceKm.toFixed(1) })}</td>
                      <td>
                        <span className={statusBadgeClass(item.status)}>
                          <span className="badge-dot" />
                          {t(`shopRequestStatus.${displayStatus}`)}
                        </span>
                      </td>
                      <td>{formatDateTime(item.deliveredAt, i18n.language)}</td>
                      <td>
                        <div className="u-flex" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                          {displayStatus === 'PENDING' ? (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAcknowledge(item.repairRequestId)
                                }}
                              >
                                {t('shopInbox.acknowledge')}
                              </button>
                              <button
                                className="btn btn-danger-outline btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDecline(item.repairRequestId)
                                }}
                              >
                                {t('shopInbox.decline')}
                              </button>
                            </>
                          ) : null}
                          <button
                            className="view-link"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenRequest(item.repairRequestId)
                            }}
                            type="button"
                          >
                            {t('shopInbox.viewDetail')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
