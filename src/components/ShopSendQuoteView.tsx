import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneInput } from './PhoneInput'
import type { LineItemPayload, RepairRequest, SubmitQuotePayload } from '../domain/types'
import { formatCurrencyPln } from '../utils/format'

type PriceMode = 'single' | 'range'

interface LineItemDraft {
  key: number
  description: string
  priceMode: PriceMode
  priceMin: string
  priceMax: string
}

interface ShopSendQuoteViewProps {
  request: RepairRequest
  onSubmit: (payload: SubmitQuotePayload, phone?: string) => Promise<void>
  onBack: () => void
}

let nextLineItemKey = 1

export function ShopSendQuoteView({ request, onSubmit, onBack }: ShopSendQuoteViewProps) {
  const { t, i18n } = useTranslation()
  const [priceMode, setPriceMode] = useState<PriceMode>('single')
  const [pricePln, setPricePln] = useState('')
  const [priceMinPln, setPriceMinPln] = useState('')
  const [priceMaxPln, setPriceMaxPln] = useState('')
  const [useLineItems, setUseLineItems] = useState(false)
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([])
  const [estimatedDays, setEstimatedDays] = useState('')
  const [note, setNote] = useState('')
  const [sharePhone, setSharePhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { key: nextLineItemKey++, description: '', priceMode: 'single', priceMin: '', priceMax: '' },
    ])
  }

  const removeLineItem = (key: number) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key))
  }

  const updateLineItem = (key: number, field: keyof Omit<LineItemDraft, 'key'>, value: string) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item
        const updated = { ...item, [field]: value }
        if (field === 'priceMode' && value === 'single') {
          updated.priceMax = ''
        }
        return updated
      }),
    )
  }

  const toggleLineItems = () => {
    if (useLineItems) {
      setUseLineItems(false)
      setLineItems([])
    } else {
      setUseLineItems(true)
      if (lineItems.length === 0) {
        setLineItems([{ key: nextLineItemKey++, description: '', priceMode: 'single', priceMin: '', priceMax: '' }])
      }
    }
  }

  const lineItemsTotal = useMemo(() => {
    if (!useLineItems || lineItems.length === 0) return null
    let totalMin = 0
    let totalMax = 0
    for (const item of lineItems) {
      const min = parseFloat(item.priceMin) || 0
      const max = item.priceMode === 'range' ? (parseFloat(item.priceMax) || min) : min
      totalMin += min
      totalMax += max
    }
    return { totalMin, totalMax }
  }, [useLineItems, lineItems])

  const validate = (): boolean => {
    const errs: string[] = []

    if (useLineItems) {
      if (lineItems.length === 0) {
        errs.push(t('shopQuoteForm.lineItemPriceRequired'))
      }
      for (const item of lineItems) {
        if (!item.description.trim()) {
          errs.push(t('shopQuoteForm.lineItemDescriptionRequired'))
          break
        }
        const min = parseFloat(item.priceMin)
        if (!item.priceMin || isNaN(min) || min <= 0) {
          errs.push(t('shopQuoteForm.lineItemPriceRequired'))
          break
        }
      }
    } else if (priceMode === 'range') {
      const min = parseFloat(priceMinPln)
      if (!priceMinPln || isNaN(min) || min <= 0) {
        errs.push(t('shopQuoteForm.priceRequired'))
      }
    } else {
      const price = parseFloat(pricePln)
      if (!pricePln || isNaN(price) || price <= 0) {
        errs.push(t('shopQuoteForm.priceRequired'))
      }
    }

    if (sharePhone && !phone.trim()) {
      errs.push(t('shopQuoteForm.phoneRequired'))
    }
    setErrors(errs)
    return errs.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      let payload: SubmitQuotePayload

      if (useLineItems) {
        const items: LineItemPayload[] = lineItems.map((item, i) => {
          const min = Math.round(parseFloat(item.priceMin) * 100)
          let max: number | undefined
          if (item.priceMode === 'range') {
            const maxVal = parseFloat(item.priceMax)
            max = !isNaN(maxVal) && maxVal > 0 ? Math.round(maxVal * 100) : undefined
          }
          return {
            position: i,
            description: item.description.trim(),
            totalPriceMinMinor: min,
            totalPriceMaxMinor: max,
          }
        })
        payload = {
          currency: 'PLN',
          estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : undefined,
          note: note.trim() || undefined,
          lineItems: items,
        }
      } else if (priceMode === 'range') {
        const min = Math.round(parseFloat(priceMinPln) * 100)
        const maxVal = parseFloat(priceMaxPln)
        const max = !isNaN(maxVal) && maxVal > 0 ? Math.round(maxVal * 100) : undefined
        payload = {
          priceMinMinorUnits: min,
          priceMaxMinorUnits: max,
          currency: 'PLN',
          estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : undefined,
          note: note.trim() || undefined,
        }
      } else {
        const price = Math.round(parseFloat(pricePln) * 100)
        payload = {
          priceMinMinorUnits: price,
          currency: 'PLN',
          estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : undefined,
          note: note.trim() || undefined,
        }
      }

      await onSubmit(payload, sharePhone ? phone.trim() : undefined)
    } catch (err) {
      setErrors([err instanceof Error ? err.message : t('shopQuoteForm.submitFailed')])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="screen shop-quote-screen">
      <button className="btn btn-ghost back-btn" onClick={onBack}>
        {t('common.back')}
      </button>

      <h2>{t('shopQuoteForm.title')}</h2>

      {/* Context card */}
      <div className="quote-context-card">
        <h3>
          {request.car.make} {request.car.model} ({request.car.year})
        </h3>
        <p>{request.issue.description}</p>
      </div>

      <form className="quote-form" onSubmit={(e) => void handleSubmit(e)}>
        {errors.length > 0 ? (
          <div className="auth-error">
            {errors.map((err, i) => <p key={i}>{err}</p>)}
          </div>
        ) : null}

        <div className="form-grid">
          {/* Mode A: Simple total price (no line items) */}
          {!useLineItems ? (
            <>
              <div className="quote-price-mode">
                <button
                  type="button"
                  className={`chip ${priceMode === 'single' ? 'chip-active' : ''}`}
                  onClick={() => setPriceMode('single')}
                >
                  {t('shopQuoteForm.singlePrice')}
                </button>
                <button
                  type="button"
                  className={`chip ${priceMode === 'range' ? 'chip-active' : ''}`}
                  onClick={() => setPriceMode('range')}
                >
                  {t('shopQuoteForm.priceRange')}
                </button>
              </div>

              {priceMode === 'single' ? (
                <label>
                  {t('shopQuoteForm.price')}
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricePln}
                      onChange={(e) => setPricePln(e.target.value)}
                      placeholder="0.00"
                    />
                    <span className="input-suffix">PLN</span>
                  </div>
                </label>
              ) : null}

              {priceMode === 'range' ? (
                <div className="price-inputs-row">
                  <label>
                    {t('shopQuoteForm.priceMin')}
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceMinPln}
                        onChange={(e) => setPriceMinPln(e.target.value)}
                        placeholder="0.00"
                      />
                      <span className="input-suffix">PLN</span>
                    </div>
                  </label>
                  <label>
                    {t('shopQuoteForm.priceMax')}
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceMaxPln}
                        onChange={(e) => setPriceMaxPln(e.target.value)}
                        placeholder="0.00"
                      />
                      <span className="input-suffix">PLN</span>
                    </div>
                  </label>
                </div>
              ) : null}
            </>
          ) : null}

          {/* Line items */}
          <button
            type="button"
            className={`line-items-toggle ${useLineItems ? 'line-items-toggle-remove' : ''}`}
            onClick={toggleLineItems}
          >
            {useLineItems ? t('shopQuoteForm.removeLineItems') : t('shopQuoteForm.addLineItems')}
          </button>

          {useLineItems ? (
            <div className="quote-line-items quote-line-items-visible">
              {lineItems.map((item, i) => (
                <div className="line-item-card" key={item.key}>
                  <div className="line-item-header">
                    <span className="line-item-number">{i + 1}.</span>
                    <div className="line-item-desc">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.key, 'description', e.target.value)}
                        placeholder={t('shopQuoteForm.lineItemDescriptionPlaceholder')}
                      />
                    </div>
                    {lineItems.length > 1 ? (
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => removeLineItem(item.key)}
                        title={t('shopQuoteForm.removeItem')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  <div className="quote-price-mode quote-price-mode-inline">
                    <button
                      type="button"
                      className={`chip chip-sm ${item.priceMode === 'single' ? 'chip-active' : ''}`}
                      onClick={() => updateLineItem(item.key, 'priceMode', 'single')}
                    >
                      {t('shopQuoteForm.singlePrice')}
                    </button>
                    <button
                      type="button"
                      className={`chip chip-sm ${item.priceMode === 'range' ? 'chip-active' : ''}`}
                      onClick={() => updateLineItem(item.key, 'priceMode', 'range')}
                    >
                      {t('shopQuoteForm.priceRange')}
                    </button>
                  </div>
                  <div className="line-item-prices">
                    <label>
                      {item.priceMode === 'range' ? t('shopQuoteForm.lineItemPriceMin') : t('shopQuoteForm.lineItemPrice')}
                      <div className="input-with-suffix">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.priceMin}
                          onChange={(e) => updateLineItem(item.key, 'priceMin', e.target.value)}
                          placeholder="0.00"
                        />
                        <span className="input-suffix">PLN</span>
                      </div>
                    </label>
                    {item.priceMode === 'range' ? (
                      <label>
                        {t('shopQuoteForm.lineItemPriceMax')}
                        <div className="input-with-suffix">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.priceMax}
                            onChange={(e) => updateLineItem(item.key, 'priceMax', e.target.value)}
                            placeholder="0.00"
                          />
                          <span className="input-suffix">PLN</span>
                        </div>
                      </label>
                    ) : null}
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="line-items-toggle"
                onClick={addLineItem}
              >
                {t('shopQuoteForm.addLineItem')}
              </button>

              {/* Line items total */}
              {lineItemsTotal && lineItemsTotal.totalMin > 0 ? (
                <div className="line-items-total">
                  <span>{t('shopQuoteForm.lineItemTotal')}</span>
                  <strong>
                    {lineItemsTotal.totalMax > lineItemsTotal.totalMin
                      ? `${formatCurrencyPln(lineItemsTotal.totalMin, i18n.language)} – ${formatCurrencyPln(lineItemsTotal.totalMax, i18n.language)}`
                      : formatCurrencyPln(lineItemsTotal.totalMin, i18n.language)}
                  </strong>
                </div>
              ) : null}
            </div>
          ) : null}

          <label>
            {t('shopQuoteForm.estimatedDays')} <small>({t('form.optional')})</small>
            <input
              type="number"
              min="1"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder="e.g. 3"
            />
          </label>

          <label>
            {t('shopQuoteForm.note')} <small>({t('form.optional')})</small>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('shopQuoteForm.notePlaceholder')}
              rows={3}
            />
          </label>
        </div>

        {/* Share phone toggle */}
        <div className="phone-share-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={sharePhone}
              onChange={(e) => setSharePhone(e.target.checked)}
            />
            {t('shopQuoteForm.sharePhoneLabel')}
          </label>
          {sharePhone ? (
            <PhoneInput
              value={phone}
              onChange={setPhone}
              placeholder={t('shopQuoteForm.phonePlaceholder')}
            />
          ) : null}
        </div>

        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting}>
          {submitting ? t('shopQuoteForm.submitting') : t('shopQuoteForm.submit')}
        </button>
      </form>
    </section>
  )
}
