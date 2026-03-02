import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../services/apiClient'
import { createVoucher } from '../services/adminApi'

const VOUCHER_PATTERN = /^[a-zA-Z0-9]{6,30}$/

interface VoucherEntry {
  id: string
  code: string
  createdAt: string
}

interface AdminVouchersViewProps {
  onLogout: () => void
}

function generateRandomCode(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

export function AdminVouchersView({ onLogout }: AdminVouchersViewProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [recentVouchers, setRecentVouchers] = useState<VoucherEntry[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const handleCodeChange = (value: string) => {
    // Strip non-alphanumeric characters
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '')
    setCode(cleaned)
  }

  const handleGenerateRandom = () => {
    setCode(generateRandomCode())
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!VOUCHER_PATTERN.test(code)) {
      setError(t('admin.voucherInvalidFormat'))
      return
    }

    setSubmitting(true)
    try {
      const result = await createVoucher(code)
      setSuccess(t('admin.voucherCreated'))
      setRecentVouchers((prev) => [
        { id: result.id, code: result.code, createdAt: new Date().toISOString() },
        ...prev,
      ])
      setCode('')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(t('admin.voucherAlreadyExists'))
        } else if (err.status === 400) {
          setError(t('admin.voucherInvalidFormat'))
        } else {
          setError(t('admin.voucherCreateFailed'))
        }
      } else {
        setError(t('admin.voucherCreateFailed'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async (voucherCode: string) => {
    try {
      await navigator.clipboard.writeText(voucherCode)
      setCopied(voucherCode)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <section className="screen admin-vouchers">
      <div className="admin-vouchers-header">
        <div>
          <h1>{t('admin.vouchersTitle')}</h1>
          <p>{t('admin.vouchersSubtitle')}</p>
        </div>
        <button className="btn btn-ghost" onClick={onLogout}>
          {t('auth.logout')}
        </button>
      </div>

      <form className="card admin-voucher-form" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          {t('admin.voucherCodeLabel')}
          <div className="admin-voucher-input-row">
            <input
              className="admin-voucher-input"
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={t('admin.voucherCodePlaceholder')}
              maxLength={30}
            />
            <button
              className="btn btn-ghost"
              type="button"
              onClick={handleGenerateRandom}
            >
              {t('admin.generateRandom')}
            </button>
          </div>
          <span className="field-hint">{t('admin.voucherCodeHint')}</span>
        </label>

        {error ? <div className="auth-error">{error}</div> : null}
        {success ? <div className="admin-success">{success}</div> : null}

        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting}>
          {submitting ? t('admin.creatingVoucher') : t('admin.createVoucher')}
        </button>
      </form>

      {recentVouchers.length > 0 ? (
        <div className="admin-recent-vouchers">
          <h3>{t('admin.recentVouchers')}</h3>
          <ul className="admin-voucher-list">
            {recentVouchers.map((v) => (
              <li className="admin-voucher-item" key={v.id}>
                <code className="admin-voucher-code">{v.code}</code>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => void handleCopy(v.code)}
                >
                  {copied === v.code ? '✓' : t('admin.copy')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
