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

export function ShopInboxView({ queueItems, onOpenRequest, onAcknowledge, onDecline }: ShopInboxViewProps) {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<ShopInboxFilter>('all')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => {
    const newCount = queueItems.filter((i) => i.status === 'PENDING' || i.status === null).length
    const inProgress = queueItems.filter((i) => i.status === 'ACKNOWLEDGED').length
    const quoted = queueItems.filter((i) => i.status === 'QUOTED').length
    return { newCount, inProgress, quoted, total: queueItems.length }
  }, [queueItems])

  const filtered = useMemo(() => {
    let items = queueItems
    if (filter !== 'all') {
      items = items.filter((i) => statusToFilter(i.status) === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (i) =>
          i.make.toLowerCase().includes(q) ||
          i.model.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
      )
    }
    return items
  }, [queueItems, filter, search])

  return (
    <section className="screen shop-inbox-screen">
      <header className="shop-inbox-hero">
        <div className="hero-content">
          <p className="eyebrow">{t('shopInbox.eyebrow')}</p>
          <h1>{t('shopInbox.headline')}</h1>
          <p>{t('shopInbox.subheadline')}</p>
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-item">
          <span className="stat-number">{stats.newCount}</span>
          <span className="stat-label">{t('shopInbox.statNew')}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{stats.inProgress}</span>
          <span className="stat-label">{t('shopInbox.statInProgress')}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{stats.quoted}</span>
          <span className="stat-label">{t('shopInbox.statQuoted')}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">{t('shopInbox.statTotal')}</span>
        </div>
      </div>

      <div className="shop-search">
        <input
          type="text"
          placeholder={t('shopInbox.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-chips">
        {FILTERS.map((f) => (
          <button key={f} className={`chip ${filter === f ? 'chip-active' : ''}`} onClick={() => setFilter(f)}>
            {t(`shopInbox.filter_${f}`)}
          </button>
        ))}
      </div>

      <div className="cards-stack">
        {filtered.length === 0 ? <article className="empty-state">{t('shopInbox.noItems')}</article> : null}
        {filtered.map((item) => {
          const displayStatus = item.status ?? 'PENDING'
          return (
            <article
              className="request-card shop-queue-card"
              key={item.repairRequestId}
              onClick={() => onOpenRequest(item.repairRequestId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onOpenRequest(item.repairRequestId)
              }}
            >
              <div>
                <h3>
                  {item.make} {item.model} ({item.year})
                </h3>
                <p className="description-truncated">{item.description}</p>
                <div className="queue-card-meta">
                  <span className="meta-item">{t('shopInbox.kmAway', { distance: item.distanceKm.toFixed(1) })}</span>
                  <span className="meta-item">{formatDateTime(item.deliveredAt, i18n.language)}</span>
                  {item.hasMessages ? (
                    <span className="meta-item unread-indicator">{t('shopInbox.newMessages')}</span>
                  ) : null}
                </div>
                {item.categories.length > 0 ? (
                  <div className="tags-inline">
                    {item.categories.map((tag) => (
                      <span className="pill pill-tag" key={tag}>
                        {t(`tags.${tag}`, tag)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="request-meta">
                <span className={`pill pill-shop-${statusToFilter(item.status)}`}>
                  {t(`shopRequestStatus.${displayStatus}`)}
                </span>
                {displayStatus === 'PENDING' ? (
                  <div className="inbox-quick-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-sm btn-primary" onClick={() => onAcknowledge(item.repairRequestId)}>
                      {t('shopInbox.acknowledge')}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => onDecline(item.repairRequestId)}>
                      {t('shopInbox.decline')}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
