import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CompatiblePart, PartOffer, WholesalerError } from '../domain/parts-types'
import { formatCurrencyPln } from '../utils/format'

interface PartsListProps {
  compatibleParts: CompatiblePart[]
  offers: PartOffer[]
  failedSources: WholesalerError[]
  onAddPart: (description: string, priceMinor?: number) => void
  onSearch: (query: string) => void
  searching: boolean
}

const INITIAL_DISPLAY = 10

const AVAIL_CLASS: Record<string, string> = {
  IN_STOCK: 'parts-avail-in-stock',
  LOW_STOCK: 'parts-avail-low-stock',
  ON_ORDER: 'parts-avail-on-order',
  UNAVAILABLE: 'parts-avail-unavailable',
}

const AVAIL_KEY: Record<string, string> = {
  IN_STOCK: 'partsSearch.inStock',
  LOW_STOCK: 'partsSearch.lowStock',
  ON_ORDER: 'partsSearch.onOrder',
  UNAVAILABLE: 'partsSearch.unavailable',
}

export function PartsList({ compatibleParts, offers, failedSources, onAddPart, onSearch, searching }: PartsListProps) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSearch(value.trim())
      }, 500)
    },
    [onSearch],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleAddOffer = (offer: PartOffer) => {
    const desc = `${offer.brand} ${offer.name} (${offer.articleNumber})`
    onAddPart(desc, offer.priceMinorUnits)
    setAddedKeys((prev) => new Set(prev).add(offer.sku))
  }

  const handleAddPart = (part: CompatiblePart) => {
    const desc = `${part.brandName} ${part.articleName} (${part.articleNumber})`
    onAddPart(desc)
    setAddedKeys((prev) => new Set(prev).add(part.articleNumber))
  }

  const displayedOffers = showAll ? offers : offers.slice(0, INITIAL_DISPLAY)
  const displayedParts = showAll ? compatibleParts : compatibleParts.slice(0, INITIAL_DISPLAY)
  const totalItems = offers.length + compatibleParts.length
  const hasMore = !showAll && totalItems > INITIAL_DISPLAY

  return (
    <div className="parts-list">
      <div className="parts-search-bar">
        <label>
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={t('partsSearch.searchPlaceholder')}
          />
        </label>
      </div>

      {searching ? <p className="parts-loading">{t('partsSearch.searching')}</p> : null}

      {failedSources.length > 0 ? (
        <div className="parts-sources-warning">
          {t('partsSearch.failedSources', { sources: failedSources.map((s) => s.sourceCode).join(', ') })}
        </div>
      ) : null}

      {!searching && offers.length === 0 && compatibleParts.length === 0 ? (
        <p className="parts-no-results">{t('partsSearch.noResults')}</p>
      ) : null}

      {displayedOffers.map((offer) => (
        <div className="parts-card" key={offer.sku}>
          <div className="parts-card-info">
            <span className="parts-card-brand">{offer.brand}</span>
            <span className="parts-card-name">{offer.name}</span>
            <span className="parts-card-article">{offer.articleNumber}</span>
          </div>
          <div className="parts-card-meta">
            <span className="parts-card-price">{formatCurrencyPln(offer.priceMinorUnits / 100, i18n.language)}</span>
            <span className={`parts-avail ${AVAIL_CLASS[offer.availability] ?? ''}`}>
              {t(AVAIL_KEY[offer.availability] ?? 'partsSearch.unavailable')}
            </span>
            {offer.leadTimeDays ? (
              <span className="parts-card-lead">{t('partsSearch.leadTime', { days: offer.leadTimeDays })}</span>
            ) : null}
          </div>
          <button
            type="button"
            className={`btn btn-sm ${addedKeys.has(offer.sku) ? 'btn-ghost' : 'btn-primary'}`}
            onClick={() => handleAddOffer(offer)}
            disabled={addedKeys.has(offer.sku)}
          >
            {addedKeys.has(offer.sku) ? t('partsSearch.added') : t('partsSearch.addToQuote')}
          </button>
        </div>
      ))}

      {displayedParts.map((part) => (
        <div className="parts-card" key={part.articleNumber}>
          <div className="parts-card-info">
            <span className="parts-card-brand">{part.brandName}</span>
            <span className="parts-card-name">{part.articleName}</span>
            <span className="parts-card-article">{part.articleNumber}</span>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${addedKeys.has(part.articleNumber) ? 'btn-ghost' : 'btn-primary'}`}
            onClick={() => handleAddPart(part)}
            disabled={addedKeys.has(part.articleNumber)}
          >
            {addedKeys.has(part.articleNumber) ? t('partsSearch.added') : t('partsSearch.addToQuote')}
          </button>
        </div>
      ))}

      {hasMore ? (
        <button type="button" className="parts-show-more btn btn-ghost btn-sm" onClick={() => setShowAll(true)}>
          {t('partsSearch.showingLimit', { count: INITIAL_DISPLAY })}
        </button>
      ) : null}
    </div>
  )
}
