import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RepairRequest, SubmitQuotePayload } from '../domain/types'

interface ShopSendQuoteViewProps {
  request: RepairRequest
  onSubmit: (payload: SubmitQuotePayload, phone?: string) => Promise<void>
  onBack: () => void
}

export function ShopSendQuoteView({ request, onSubmit, onBack }: ShopSendQuoteViewProps) {
  const { t } = useTranslation()
  const [pricePln, setPricePln] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('')
  const [note, setNote] = useState('')
  const [sharePhone, setSharePhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validate = (): boolean => {
    const errs: string[] = []
    const price = parseFloat(pricePln)
    if (!pricePln || isNaN(price) || price <= 0) {
      errs.push(t('shopQuoteForm.priceRequired'))
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
      const payload: SubmitQuotePayload = {
        priceMinorUnits: Math.round(parseFloat(pricePln) * 100),
        currency: 'PLN',
        estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : undefined,
        note: note.trim() || undefined,
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
            <input
              type="tel"
              placeholder={t('shopQuoteForm.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
