import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_RADIUS_KM, ISSUE_TAGS, MAX_CAR_YEAR, MAX_RADIUS_KM, MIN_CAR_YEAR, MIN_RADIUS_KM } from '../domain/constants'
import type { Attachment, CreateRepairRequestPayload, RepairRequest } from '../domain/types'
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete'
import { fileToAttachment, revokeAttachmentPreview, revokeAttachmentsPreview } from '../utils/attachments'
import { isValidVin, normalizeVin, validateYear } from '../utils/validation'
import { AttachmentGrid } from './AttachmentGrid'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_ATTACHMENTS = 5

interface CreateRepairRequestFlowProps {
  onCancel: () => void
  onSubmitRequest: (payload: CreateRepairRequestPayload, files: Map<string, File>) => Promise<RepairRequest>
  onViewRequest: (requestId: string) => void
}

type FormStep = 1 | 2 | 3 | 4

interface CarErrors {
  vin?: string
  make?: string
  model?: string
  year?: string
  mileageKm?: string
}

interface IssueErrors {
  description?: string
}

interface LocationErrors {
  address?: string
  radiusKm?: string
}

export function CreateRepairRequestFlow({
  onCancel,
  onSubmitRequest,
  onViewRequest,
}: CreateRepairRequestFlowProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<FormStep>(1)
  const [showOptionalCar, setShowOptionalCar] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null)

  const [vin, setVin] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [variant, setVariant] = useState('')
  const [year, setYear] = useState('')
  const [engineType, setEngineType] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [mileageKm, setMileageKm] = useState('')

  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [issueAttachments, setIssueAttachments] = useState<Attachment[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const fileMapRef = useRef<Map<string, File>>(new Map())

  const autocomplete = useAddressAutocomplete()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [geolocating, setGeolocating] = useState(false)
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)

  const [carErrors, setCarErrors] = useState<CarErrors>({})
  const [issueErrors, setIssueErrors] = useState<IssueErrors>({})
  const [locationErrors, setLocationErrors] = useState<LocationErrors>({})

  useEffect(() => {
    return () => {
      revokeAttachmentsPreview(issueAttachments)
    }
  }, [issueAttachments])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return
    setGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords
        try {
          const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lon.toString(),
            format: 'json',
            addressdetails: '1',
          })
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params}`,
            { headers: { 'Accept-Language': 'pl,en' } },
          )
          if (res.ok) {
            const data = await res.json()
            autocomplete.pick({
              displayName: data.display_name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
              lat,
              lon,
              street: data.address
                ? [data.address.road, data.address.house_number].filter(Boolean).join(' ') || undefined
                : undefined,
              city: data.address?.city ?? data.address?.town ?? data.address?.village,
              postcode: data.address?.postcode,
            })
          }
        } catch {
          // Reverse geocode failed — still set coords
          autocomplete.pick({
            displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            lat,
            lon,
          })
        } finally {
          setGeolocating(false)
        }
      },
      () => {
        setGeolocating(false)
      },
    )
  }

  const stepLabels = useMemo(() => [t('form.stepCar'), t('form.stepIssue'), t('form.stepLocation')], [t])

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return t('form.titleCar')
      case 2:
        return t('form.titleIssue')
      case 3:
        return t('form.titleLocation')
      case 4:
        return t('form.titleSubmitted')
      default:
        return ''
    }
  }, [step, t])

  const toggleTag = (tag: string) => {
    setTags((previous) => {
      if (previous.includes(tag)) {
        return previous.filter((item) => item !== tag)
      }

      return [...previous, tag]
    })
  }

  const validateCar = (): boolean => {
    const nextErrors: CarErrors = {}
    const normalizedVin = normalizeVin(vin)
    const yearNumber = Number.parseInt(year, 10)

    if (!isValidVin(normalizedVin)) {
      nextErrors.vin = 'validation.vinInvalid'
    }

    if (!make.trim()) {
      nextErrors.make = 'validation.makeRequired'
    }

    if (!model.trim()) {
      nextErrors.model = 'validation.modelRequired'
    }

    const yearError = validateYear(yearNumber)
    if (yearError) {
      nextErrors.year = yearError
    }

    if (mileageKm.trim()) {
      const mileageNumber = Number.parseInt(mileageKm, 10)
      if (!Number.isInteger(mileageNumber) || mileageNumber < 0) {
        nextErrors.mileageKm = 'validation.mileageInvalid'
      }
    }

    setCarErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateIssue = (): boolean => {
    const nextErrors: IssueErrors = {}
    if (description.trim().length < 12) {
      nextErrors.description = 'validation.descriptionTooShort'
    }

    setIssueErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateLocation = (): boolean => {
    const nextErrors: LocationErrors = {}
    if (!autocomplete.query.trim()) {
      nextErrors.address = 'validation.addressRequired'
    } else if (!autocomplete.selected) {
      nextErrors.address = 'validation.selectAddress'
    }

    if (radiusKm < MIN_RADIUS_KM || radiusKm > MAX_RADIUS_KM) {
      nextErrors.radiusKm = 'validation.radiusOutOfRange'
    }

    setLocationErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const removeIssueAttachment = (attachmentId: string) => {
    fileMapRef.current.delete(attachmentId)
    setIssueAttachments((previous) => {
      const target = previous.find((attachment) => attachment.id === attachmentId)
      if (target) {
        revokeAttachmentPreview(target)
      }

      return previous.filter((attachment) => attachment.id !== attachmentId)
    })
  }

  const handleNext = () => {
    if (step === 1) {
      if (validateCar()) {
        setStep(2)
      }
      return
    }

    if (step === 2) {
      if (validateIssue()) {
        setStep(3)
      }
    }
  }

  const handleSubmit = async () => {
    if (!validateLocation()) {
      return
    }

    const payload: CreateRepairRequestPayload = {
      car: {
        vin: normalizeVin(vin),
        make: make.trim(),
        model: model.trim(),
        variant: variant.trim(),
        year: Number.parseInt(year, 10),
        engineType: engineType.trim() || undefined,
        fuelType: fuelType.trim() || undefined,
        mileageKm: mileageKm.trim() ? Number.parseInt(mileageKm, 10) : undefined,
      },
      issue: {
        description: description.trim(),
        tags,
        attachments: issueAttachments,
      },
      location: {
        address: autocomplete.query.trim(),
        latitude: autocomplete.selected?.lat ?? 0,
        longitude: autocomplete.selected?.lon ?? 0,
        radiusKm,
      },
    }

    setIsSubmitting(true)
    try {
      const createdRequest = await onSubmitRequest(payload, fileMapRef.current)
      setSubmittedRequestId(createdRequest.id)
      setStep(4)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="screen create-flow">
      <div className="section-header">
        <button className="btn btn-ghost" onClick={onCancel}>
          {t('common.back')}
        </button>
        <h2 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>{t('form.newRequest')}</h2>
        <span className="step-pill">{step < 4 ? `${step}/3` : t('form.done')}</span>
      </div>

      {step < 4 ? (
        <nav className="stepper" aria-label="Form progress">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1
            const isActive = step === stepNum
            const isDone = step > stepNum
            return (
              <div key={label} style={{ display: 'contents' }}>
                {index > 0 ? <div className="stepper-line" /> : null}
                <div className={`stepper-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  <span className="stepper-dot">
                    {isDone ? '\u2713' : stepNum}
                  </span>
                  <span>{label}</span>
                </div>
              </div>
            )
          })}
        </nav>
      ) : null}

      <article className="form-card">
        <h3>{stepTitle}</h3>

        {step === 1 ? (
          <div className="form-grid">
            <label>
              {t('form.vin')}
              <input
                className="vin-input"
                value={vin}
                onChange={(event) => {
                  setVin(normalizeVin(event.target.value))
                }}
                placeholder="WAUZZZ8V9KA101234"
                maxLength={17}
              />
              {carErrors.vin ? <small className="field-error">{t(carErrors.vin)}</small> : null}
            </label>

            <label>
              {t('form.make')}
              <input
                value={make}
                onChange={(event) => {
                  setMake(event.target.value)
                }}
                placeholder="Audi"
              />
              {carErrors.make ? <small className="field-error">{t(carErrors.make)}</small> : null}
            </label>

            <label>
              {t('form.model')}
              <input
                value={model}
                onChange={(event) => {
                  setModel(event.target.value)
                }}
                placeholder="A3"
              />
              {carErrors.model ? <small className="field-error">{t(carErrors.model)}</small> : null}
            </label>

            <label>
              {t('form.variant')} <small style={{ color: 'var(--gray-400)' }}>({t('form.optional')})</small>
              <input
                value={variant}
                onChange={(event) => {
                  setVariant(event.target.value)
                }}
                placeholder="Sportback"
              />
            </label>

            <label>
              {t('form.year')}
              <input
                type="number"
                value={year}
                onChange={(event) => {
                  setYear(event.target.value)
                }}
                placeholder="2019"
              />
              {carErrors.year ? <small className="field-error">{t(carErrors.year, { min: MIN_CAR_YEAR, max: MAX_CAR_YEAR })}</small> : null}
            </label>

            <button
              type="button"
              className="btn btn-ghost inline-button"
              onClick={() => {
                setShowOptionalCar((previous) => !previous)
              }}
            >
              {showOptionalCar ? t('form.hideMoreDetails') : t('form.moreDetails')}
            </button>

            {showOptionalCar ? (
              <>
                <label>
                  {t('form.engineType')}
                  <input
                    value={engineType}
                    onChange={(event) => {
                      setEngineType(event.target.value)
                    }}
                    placeholder="1.4 TSI"
                  />
                </label>

                <label>
                  {t('form.fuelType')}
                  <input
                    value={fuelType}
                    onChange={(event) => {
                      setFuelType(event.target.value)
                    }}
                    placeholder="Petrol"
                  />
                </label>

                <label>
                  {t('form.mileageKm')}
                  <input
                    type="number"
                    value={mileageKm}
                    onChange={(event) => {
                      setMileageKm(event.target.value)
                    }}
                    placeholder="112000"
                  />
                  {carErrors.mileageKm ? (
                    <small className="field-error">{t(carErrors.mileageKm)}</small>
                  ) : null}
                </label>
              </>
            ) : null}

            <div className="sticky-cta">
              <button className="btn btn-primary btn-lg" onClick={handleNext} style={{ width: '100%' }}>
                {t('common.next')}
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="form-grid">
            <label>
              {t('form.issueQuestion')}
              <textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value)
                }}
                rows={5}
                placeholder={t('form.issuePlaceholder')}
              />
              {issueErrors.description ? (
                <small className="field-error">{t(issueErrors.description)}</small>
              ) : null}
            </label>

            <div>
              <span className="label-title">{t('form.tagsLabel')}</span>
              <div className="chips-wrap">
                {ISSUE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`chip ${tags.includes(tag) ? 'chip-active' : ''}`}
                    onClick={() => {
                      toggleTag(tag)
                    }}
                  >
                    {t(`tags.${tag}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label-title">{t('form.photosLabel')}</span>
              <label className="btn btn-secondary file-input-btn" htmlFor="issue-file-input">
                {t('form.addFile')}
              </label>
              <input
                id="issue-file-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const files = event.target.files
                  if (!files) {
                    return
                  }

                  setAttachmentError(null)
                  const remaining = MAX_ATTACHMENTS - issueAttachments.length
                  if (remaining <= 0) {
                    setAttachmentError('form.maxAttachments')
                    event.target.value = ''
                    return
                  }

                  const validFiles: File[] = []
                  for (const file of Array.from(files)) {
                    if (!ALLOWED_MIME_TYPES.has(file.type)) {
                      setAttachmentError('form.fileTypeNotAllowed')
                      continue
                    }
                    if (file.size > MAX_FILE_SIZE) {
                      setAttachmentError('form.fileTooLarge')
                      continue
                    }
                    if (validFiles.length >= remaining) {
                      setAttachmentError('form.maxAttachments')
                      break
                    }
                    validFiles.push(file)
                  }

                  const added = validFiles.map((file) => {
                    const attachment = fileToAttachment(file)
                    fileMapRef.current.set(attachment.id, file)
                    return attachment
                  })
                  setIssueAttachments((previous) => [...previous, ...added])
                  event.target.value = ''
                }}
              />
              {attachmentError ? (
                <small className="field-error">{t(attachmentError)}</small>
              ) : null}
              <AttachmentGrid
                attachments={issueAttachments}
                removable
                onRemove={removeIssueAttachment}
              />
            </div>

            <div className="sticky-cta" style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setStep(1)
                }}
              >
                {t('common.back')}
              </button>
              <button className="btn btn-primary btn-lg" onClick={handleNext} style={{ flex: 1 }}>
                {t('common.next')}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="form-grid">
            <div className="map-card" aria-label="Location map preview">
              <div className="pin-marker">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-600)' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <strong>{autocomplete.selected?.displayName || t('form.noAddress')}</strong>
                {autocomplete.selected ? (
                  <p className="address-coords">
                    {autocomplete.selected.lat.toFixed(5)}, {autocomplete.selected.lon.toFixed(5)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="address-autocomplete" ref={dropdownRef}>
              <label>
                {t('form.address')}
                <div className="address-input-wrap">
                  <input
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
                    placeholder={t('form.addressPlaceholder')}
                    autoComplete="off"
                  />
                  {autocomplete.loading ? <span className="address-spinner" /> : null}
                </div>
                {locationErrors.address ? (
                  <small className="field-error">{t(locationErrors.address)}</small>
                ) : null}
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
            </div>

            <button
              type="button"
              className="btn btn-ghost inline-button"
              onClick={handleUseCurrentLocation}
              disabled={geolocating}
            >
              {geolocating ? t('form.locating') : t('form.useCurrentLocation')}
            </button>

            <label>
              {t('form.searchRadius')} <strong>{radiusKm} km</strong>
              <input
                type="range"
                min={MIN_RADIUS_KM}
                max={MAX_RADIUS_KM}
                value={radiusKm}
                onChange={(event) => {
                  setRadiusKm(Number.parseInt(event.target.value, 10))
                }}
              />
              <small style={{ color: 'var(--gray-500)' }}>
                {t('form.radiusHelp', { radius: radiusKm })}
              </small>
              {locationErrors.radiusKm ? (
                <small className="field-error">{t(locationErrors.radiusKm, { min: MIN_RADIUS_KM, max: MAX_RADIUS_KM })}</small>
              ) : null}
            </label>

            <div className="sticky-cta" style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setStep(2)
                }}
              >
                {t('common.back')}
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                {isSubmitting ? t('form.submitting') : t('form.submitRequest')}
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="confirmation-card">
            <span className="pill pill-open">{t('status.open')}</span>
            <h4>{t('form.confirmTitle')}</h4>
            <p>{t('form.confirmMessage')}</p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => {
                if (submittedRequestId) {
                  onViewRequest(submittedRequestId)
                }
              }}
            >
              {t('form.viewRequest')}
            </button>
          </div>
        ) : null}
      </article>
    </section>
  )
}
