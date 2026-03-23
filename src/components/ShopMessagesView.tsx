import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConversations } from '../hooks/useConversations'
import { formatDateTime } from '../utils/format'

interface ShopMessagesViewProps {
  onOpenRequest: (requestId: string) => void
}

export function ShopMessagesView({ onOpenRequest }: ShopMessagesViewProps) {
  const { t, i18n } = useTranslation()
  const { conversations, loading, hasMore, loadMore, loadingMore, error } = useConversations('SHOP')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const query = search.trim().toLowerCase()
    return conversations.filter(
      (c) =>
        c.carLabel.toLowerCase().includes(query) ||
        c.counterpartyName.toLowerCase().includes(query) ||
        (c.issueTag && c.issueTag.toLowerCase().includes(query)),
    )
  }, [conversations, search])

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('messages.title')}</h1>
          <p className="page-subtitle">{t('shopInbox.subheadline')}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-filter-bar">
          <input
            className="form-input"
            type="text"
            placeholder={t('messages.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">{t('messages.loading')}</div>
        ) : error ? (
          <div className="empty-state">{t(error)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">{t('messages.noConversations')}</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('form.vehicle')}</th>
                  <th>{t('sidebar.messages')}</th>
                  <th>{t('shopInbox.statusCol')}</th>
                  <th>{t('shopInbox.dateCol')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((convo) => (
                  <tr
                    key={`${convo.repairRequestId}-${convo.shopId}`}
                    onClick={() => onOpenRequest(convo.repairRequestId)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onOpenRequest(convo.repairRequestId)
                    }}
                  >
                    <td>
                      <div className="u-flex u-items-center" style={{ gap: 10 }}>
                        <span className="vehicle-icon">
                          {convo.carLabel.charAt(0)}
                          {convo.carLabel.split(' ')[1]?.charAt(0) ?? ''}
                        </span>
                        <div>
                          <div className="vehicle-name">{convo.carLabel}</div>
                          {convo.issueTag ? <div className="vehicle-desc">{convo.issueTag}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      {convo.lastMessagePreview.length > 80
                        ? `${convo.lastMessagePreview.slice(0, 80)}...`
                        : convo.lastMessagePreview}
                    </td>
                    <td>
                      <span className="badge badge-amber">
                        <span className="badge-dot" />
                        {t('sidebar.messages')}
                      </span>
                    </td>
                    <td>{formatDateTime(convo.lastMessageAt, i18n.language)}</td>
                    <td>
                      <button
                        className="view-link"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenRequest(convo.repairRequestId)
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

        {hasMore ? (
          <div className="messages-list__load-more">
            <button className="messages-list__load-more-btn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? t('messages.loading') : t('messages.loadMore')}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
