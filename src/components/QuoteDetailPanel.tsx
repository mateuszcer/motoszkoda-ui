import { useTranslation } from 'react-i18next'
import type { ShopQuoteCard } from '../domain/types'
import { formatCurrencyPln, formatLineItemRange, formatQuoteRange } from '../utils/format'

interface QuoteDetailPanelProps {
  shop: ShopQuoteCard
  onClose: () => void
}

export function QuoteDetailPanel({ shop, onClose }: QuoteDetailPanelProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const quote = shop.quote
  const lineItems = quote?.lineItems?.length ? [...quote.lineItems].sort((a, b) => a.position - b.position) : null

  return (
    <aside className="thread-panel-backdrop" role="presentation" onClick={onClose}>
      <section
        className="thread-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${t('quoteDetail.eyebrow')} — ${shop.shopName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="thread-header">
          <div>
            <p className="eyebrow">{t('quoteDetail.eyebrow')}</p>
            <h3>{shop.shopName}</h3>
            <small>{t('detail.kmAway', { distance: shop.distanceKm.toFixed(1) })}</small>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="quote-detail-body">
          {lineItems ? (
            <>
              {lineItems.map((li, idx) => (
                <div key={li.id ?? idx}>
                  <div className="quote-line-item-row">
                    <span>{li.description}</span>
                    <span>{formatLineItemRange(li, locale)}</span>
                  </div>
                  {li.workPriceMinPln != null || li.partsPriceMinPln != null ? (
                    <div className="quote-line-item-subs">
                      {li.workPriceMinPln != null ? (
                        <div className="quote-line-item-sub">
                          <span>{t('quoteDetail.labor')}</span>
                          <span>
                            {formatCurrencyPln(li.workPriceMinPln, locale)}
                            {li.workPriceMaxPln != null && li.workPriceMaxPln !== li.workPriceMinPln
                              ? ` – ${formatCurrencyPln(li.workPriceMaxPln, locale)}`
                              : ''}
                          </span>
                        </div>
                      ) : null}
                      {li.partsPriceMinPln != null ? (
                        <div className="quote-line-item-sub">
                          <span>{t('quoteDetail.parts')}</span>
                          <span>
                            {formatCurrencyPln(li.partsPriceMinPln, locale)}
                            {li.partsPriceMaxPln != null && li.partsPriceMaxPln !== li.partsPriceMinPln
                              ? ` – ${formatCurrencyPln(li.partsPriceMaxPln, locale)}`
                              : ''}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </>
          ) : (
            <p className="quote-detail-no-breakdown">{t('quoteDetail.noBreakdown')}</p>
          )}

          {quote?.comment ? <p className="quote-detail-comment">{quote.comment}</p> : null}

          {quote?.durationDays ? (
            <small className="quote-detail-duration">{t('detail.durationDays', { count: quote.durationDays })}</small>
          ) : null}
        </div>

        {quote ? (
          <div className="quote-detail-total">
            <span>{t('quoteDetail.total')}</span>
            <strong>{formatQuoteRange(quote, locale)}</strong>
          </div>
        ) : null}
      </section>
    </aside>
  )
}
