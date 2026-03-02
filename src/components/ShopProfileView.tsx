import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ShopProfile, UpdateShopProfilePayload } from '../domain/types'
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete'

interface ShopProfileViewProps {
  profile: ShopProfile | null
  onSave: (payload: UpdateShopProfilePayload) => Promise<void>
  onBack: () => void
}

export function ShopProfileView({ profile, onSave, onBack }: ShopProfileViewProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const autocomplete = useAddressAutocomplete()

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setPhone(profile.phone)
      setDescription(profile.description)
      if (profile.address) {
        autocomplete.setQuery(profile.address)
      }
    }
    // Only run on profile change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const validate = (): boolean => {
    const errs: string[] = []
    if (!name.trim()) errs.push(t('shopProfile.nameRequired'))
    if (!autocomplete.query.trim()) errs.push(t('shopProfile.addressRequired'))
    if (!autocomplete.selected && autocomplete.query.trim()) {
      errs.push(t('shopProfile.selectAddress'))
    }
    setErrors(errs)
    return errs.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setSuccess(false)
    try {
      await onSave({
        name: name.trim(),
        address: autocomplete.query.trim(),
        phone: phone.trim(),
        description: description.trim(),
        lat: autocomplete.selected?.lat ?? 0,
        lon: autocomplete.selected?.lon ?? 0,
      })
      setSuccess(true)
    } catch (err) {
      setErrors([err instanceof Error ? err.message : t('shopProfile.saveFailed')])
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="screen shop-profile-screen">
      <button className="btn btn-ghost back-btn" onClick={onBack}>
        {t('common.back')}
      </button>

      <h2>{t('shopProfile.title')}</h2>

      <form className="profile-form" onSubmit={(e) => void handleSubmit(e)}>
        {errors.length > 0 ? (
          <div className="auth-error">
            {errors.map((err, i) => <p key={i}>{err}</p>)}
          </div>
        ) : null}
        {success ? (
          <div className="auth-success">{t('shopProfile.saved')}</div>
        ) : null}

        <div className="form-grid">
          <label>
            {t('shopProfile.name')}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('shopProfile.namePlaceholder')}
            />
          </label>

          <div className="address-autocomplete" ref={dropdownRef}>
            <label>
              {t('shopProfile.address')}
              <div className="address-input-wrap">
                <input
                  type="text"
                  value={autocomplete.query}
                  onChange={(e) => {
                    autocomplete.setQuery(e.target.value)
                    setShowDropdown(true)
                    // Clear previous selection when user edits
                    if (autocomplete.selected) {
                      autocomplete.clear()
                      autocomplete.setQuery(e.target.value)
                    }
                  }}
                  onFocus={() => {
                    if (autocomplete.suggestions.length > 0) setShowDropdown(true)
                  }}
                  placeholder={t('shopProfile.addressPlaceholder')}
                  autoComplete="off"
                />
                {autocomplete.loading ? (
                  <span className="address-spinner" />
                ) : null}
              </div>
            </label>

            {showDropdown && autocomplete.suggestions.length > 0 ? (
              <ul className="address-suggestions">
                {autocomplete.suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        autocomplete.pick(s)
                        setShowDropdown(false)
                      }}
                    >
                      {s.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {autocomplete.selected ? (
              <p className="address-coords">
                {autocomplete.selected.lat.toFixed(5)}, {autocomplete.selected.lon.toFixed(5)}
              </p>
            ) : null}
          </div>

          <label>
            {t('shopProfile.phone')}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('shopProfile.phonePlaceholder')}
            />
          </label>

          <label>
            {t('shopProfile.description')}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('shopProfile.descriptionPlaceholder')}
              rows={4}
            />
          </label>
        </div>

        <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={saving}>
          {saving ? t('shopProfile.saving') : t('shopProfile.save')}
        </button>
      </form>
    </section>
  )
}
