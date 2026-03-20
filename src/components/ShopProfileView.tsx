import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DAYS_OF_WEEK, SHOP_SPECIALIZATIONS } from '../domain/constants'
import type { DayHours, ShopProfile, UpdateShopProfilePayload } from '../domain/types'
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete'
import { getApiErrorMessage } from '../utils/apiErrors'
import { PhoneInput } from './PhoneInput'

interface ShopProfileViewProps {
  profile: ShopProfile | null
  onSave: (payload: UpdateShopProfilePayload) => Promise<void>
  onUploadLogo: (file: File) => Promise<void>
  onDeleteLogo: () => Promise<void>
  onBack: () => void
}

const DEFAULT_DESCRIPTION_MAX = 500
const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function buildDefaultHours(): DayHours[] {
  return DAYS_OF_WEEK.map((day) => ({
    day,
    open: day === 'sunday' ? '09:00' : '08:00',
    close: day === 'sunday' ? '13:00' : '17:00',
    closed: day === 'sunday',
  }))
}

export function ShopProfileView({ profile, onSave, onUploadLogo, onDeleteLogo }: ShopProfileViewProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [specializations, setSpecializations] = useState<string[]>([])
  const [openingHours, setOpeningHours] = useState<DayHours[]>(buildDefaultHours)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deletingLogo, setDeletingLogo] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const autocomplete = useAddressAutocomplete()

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setPhone(profile.phone)
      setDescription(profile.description)
      if (profile.city) setCity(profile.city)
      if (profile.postalCode) setPostalCode(profile.postalCode)
      if (profile.specializations) setSpecializations(profile.specializations)
      if (profile.openingHours) setOpeningHours(profile.openingHours)
      if (profile.address) {
        autocomplete.setQuery(profile.address)
      }
    }
    // Only run on profile change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleSpecialization = useCallback((tag: string) => {
    setSpecializations((prev) => (prev.includes(tag) ? prev.filter((s) => s !== tag) : [...prev, tag]))
  }, [])

  const updateHours = useCallback((index: number, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setOpeningHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)))
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
      setLastSavedAt(new Date())
    } catch (err) {
      setErrors([getApiErrorMessage(err, t, 'shopProfile.saveFailed')])
    } finally {
      setSaving(false)
    }
  }

  const handleAddressPick = useCallback(
    (suggestion: (typeof autocomplete.suggestions)[number]) => {
      autocomplete.pick(suggestion)
      setShowDropdown(false)
      if (suggestion.city) setCity(suggestion.city)
      if (suggestion.postcode) setPostalCode(suggestion.postcode)
    },
    [autocomplete],
  )

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      setErrors([t('shopProfile.logoFileType')])
      return
    }

    if (file.size > MAX_LOGO_FILE_SIZE) {
      setErrors([t('shopProfile.logoFileTooLarge')])
      return
    }

    setUploadingLogo(true)
    setSuccess(false)
    setErrors([])
    try {
      await onUploadLogo(file)
    } catch (err) {
      setErrors([getApiErrorMessage(err, t, 'shopProfile.logoUploadFailed')])
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleLogoDelete = async () => {
    setDeletingLogo(true)
    setSuccess(false)
    setErrors([])
    try {
      await onDeleteLogo()
    } catch (err) {
      setErrors([getApiErrorMessage(err, t, 'shopProfile.logoDeleteFailed')])
    } finally {
      setDeletingLogo(false)
    }
  }

  return (
    <section className="screen shop-profile-screen">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="shop-profile-container">
          {errors.length > 0 ? (
            <div className="auth-error">
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          ) : null}
          {success ? <div className="auth-success">{t('shopProfile.saved')}</div> : null}

          {/* Page header */}
          <div className="page-header">
            <div>
              <h2 className="page-title">{t('shopProfile.title')}</h2>
              <p className="page-subtitle">{t('shopProfile.subtitle')}</p>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {saving ? t('shopProfile.saving') : t('shopProfile.save')}
            </button>
          </div>

          {/* Card 1: Photo & Name */}
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">{t('shopProfile.sectionPhotoName')}</span>
            </div>
            <div className="card-body">
              <div className="profile-photo-row">
                <div
                  className="profile-logo-upload"
                  onClick={() => {
                    if (!uploadingLogo && !deletingLogo) fileInputRef.current?.click()
                  }}
                  role="button"
                  tabIndex={0}
                  aria-disabled={uploadingLogo || deletingLogo}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !uploadingLogo && !deletingLogo) {
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  {profile?.logoUrl ? (
                    <img src={profile.logoUrl} alt={`${profile.name} logo`} className="profile-logo-upload__image" />
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--gray-400)"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    aria-label={t('shopProfile.uploadPhoto')}
                    onChange={(e) => void handleLogoSelect(e)}
                  />
                </div>
                <div>
                  <div className="form-label">{t('shopProfile.logoTitle')}</div>
                  <p className="u-text-faint" style={{ fontSize: 12, marginBottom: 8 }}>
                    {t('shopProfile.logoHint')}
                  </p>
                  <button
                    type="button"
                    className="view-link"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo || deletingLogo}
                  >
                    {uploadingLogo ? t('shopProfile.uploadingPhoto') : t('shopProfile.uploadPhoto')}
                  </button>
                  {profile?.logoUrl ? (
                    <button
                      type="button"
                      className="view-link"
                      onClick={() => void handleLogoDelete()}
                      disabled={uploadingLogo || deletingLogo}
                    >
                      {deletingLogo ? t('shopProfile.deletingPhoto') : t('shopProfile.removePhoto')}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="shop-name">
                  {t('shopProfile.name')}
                </label>
                <input
                  id="shop-name"
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('shopProfile.namePlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Location & Contact */}
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">{t('shopProfile.sectionLocationContact')}</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <div className="address-autocomplete" ref={dropdownRef}>
                  <label className="form-label" htmlFor="shop-address">
                    {t('shopProfile.address')}
                  </label>
                  <div className="address-input-wrap">
                    <input
                      id="shop-address"
                      className="form-input"
                      type="text"
                      value={autocomplete.query}
                      onChange={(e) => {
                        autocomplete.setQuery(e.target.value)
                        setShowDropdown(true)
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
                    {autocomplete.loading ? <span className="address-spinner" /> : null}
                  </div>
                  {showDropdown && autocomplete.suggestions.length > 0 ? (
                    <ul className="address-suggestions">
                      {autocomplete.suggestions.map((s, i) => (
                        <li key={i}>
                          <button type="button" onClick={() => handleAddressPick(s)}>
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
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="shop-city">
                    {t('shopProfile.city')}
                  </label>
                  <input
                    id="shop-city"
                    className="form-input"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('shopProfile.cityPlaceholder')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="shop-postal">
                    {t('shopProfile.postalCode')}
                  </label>
                  <input
                    id="shop-postal"
                    className="form-input"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder={t('shopProfile.postalCodePlaceholder')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="shop-phone">
                  {t('shopProfile.phone')}
                </label>
                <PhoneInput value={phone} onChange={setPhone} placeholder={t('shopProfile.phonePlaceholder')} />
              </div>
            </div>
          </div>

          {/* Card 3: About */}
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">{t('shopProfile.sectionAbout')}</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label" htmlFor="shop-description">
                  {t('shopProfile.description')}{' '}
                  <span className="u-text-faint">{t('shopProfile.descriptionHint')}</span>
                </label>
                <textarea
                  id="shop-description"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('shopProfile.descriptionPlaceholder')}
                  rows={4}
                  maxLength={DEFAULT_DESCRIPTION_MAX}
                />
                <div className="char-counter">
                  {t('shopProfile.charCount', { count: description.length, max: DEFAULT_DESCRIPTION_MAX })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('shopProfile.specializations')}</label>
                <div className="specializations-grid">
                  {SHOP_SPECIALIZATIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`cat-pill${specializations.includes(tag) ? ' cat-pill-selected' : ''}`}
                      onClick={() => toggleSpecialization(tag)}
                    >
                      {t(`tags.${tag}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Opening Hours */}
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">{t('shopProfile.sectionHours')}</span>
            </div>
            <div className="card-body">
              {openingHours.map((h, i) => (
                <div className="hours-row" key={h.day}>
                  <span className={`hours-row__day${h.closed ? ' hours-row__day--closed' : ''}`}>
                    {t(`days.${h.day}`)}
                  </span>
                  {h.closed ? (
                    <span className="hours-row__closed-label">{t('shopProfile.closed')}</span>
                  ) : (
                    <div className="hours-row__inputs">
                      <input
                        type="time"
                        className="form-input hours-row__time"
                        value={h.open}
                        onChange={(e) => updateHours(i, 'open', e.target.value)}
                        aria-label={`${t(`days.${h.day}`)} open`}
                      />
                      <span className="hours-row__separator">&mdash;</span>
                      <input
                        type="time"
                        className="form-input hours-row__time"
                        value={h.close}
                        onChange={(e) => updateHours(i, 'close', e.target.value)}
                        aria-label={`${t(`days.${h.day}`)} close`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom save bar */}
          <div className="profile-save-bar">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {saving ? t('shopProfile.saving') : t('shopProfile.save')}
            </button>
            {lastSavedAt ? (
              <span className="profile-save-bar__timestamp">
                {t('shopProfile.lastSaved', {
                  date: lastSavedAt.toLocaleString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                })}
              </span>
            ) : null}
          </div>
        </div>
      </form>
    </section>
  )
}
