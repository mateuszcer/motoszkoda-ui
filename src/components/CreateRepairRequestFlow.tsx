import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DEFAULT_RADIUS_KM,
  ISSUE_TAGS,
  MAX_CAR_YEAR,
  MAX_RADIUS_KM,
  MIN_CAR_YEAR,
  MIN_RADIUS_KM,
} from '../domain/constants'
import type { Attachment, CreateRepairRequestPayload, RepairRequest } from '../domain/types'
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete'
import { fileToAttachment, revokeAttachmentPreview, revokeAttachmentsPreview } from '../utils/attachments'
import { isValidVin, normalizeVin, validateYear } from '../utils/validation'
import { AttachmentGrid } from './AttachmentGrid'
import { CarBrandCombobox } from './CarBrandCombobox'
import { LocationStep } from './LocationStep'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_ATTACHMENTS = 5

interface CreateRepairRequestFlowProps {
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

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  )
}

function getVehicleInitials(make: string) {
  return make.trim().slice(0, 2).toUpperCase() || '??'
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`
}

export function CreateRepairRequestFlow({ onSubmitRequest, onViewRequest }: CreateRepairRequestFlowProps) {
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
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)

  const [carErrors, setCarErrors] = useState<CarErrors>({})
  const [issueErrors, setIssueErrors] = useState<IssueErrors>({})
  const [locationErrors, setLocationErrors] = useState<LocationErrors>({})

  useEffect(() => {
    return () => {
      revokeAttachmentsPreview(issueAttachments)
    }
  }, [issueAttachments])

  const stepLabels = useMemo(() => [t('form.stepCar'), t('form.stepIssue'), t('form.stepLocation')], [t])

  const vehicleName = [make.trim(), model.trim(), variant.trim()].filter(Boolean).join(' ')
  const vehicleNameWithYear = year.trim() ? `${vehicleName} (${year.trim()})` : vehicleName
  const vehicleMeta = [year.trim(), vin ? `VIN: ${truncateText(vin, 12)}` : ''].filter(Boolean).join(' · ')
  const selectedCategory = tags[0] ? t(`tags.${tags[0]}`) : t('form.notSpecified')
  const trimmedDescription = description.trim()
  const issuePreview = trimmedDescription ? truncateText(trimmedDescription, 54) : t('form.notSpecified')
  const summaryLocation = autocomplete.selected?.city ?? autocomplete.selected?.displayName ?? autocomplete.query.trim()
  const summaryRange = summaryLocation ? `${radiusKm} km · ${summaryLocation}` : `${radiusKm} km`
  const photoSummary =
    issueAttachments.length > 0 ? t('form.photoCount', { count: issueAttachments.length }) : t('form.noPhotos')

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

    if (normalizedVin && !isValidVin(normalizedVin)) {
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

    if (step === 2 && validateIssue()) {
      setStep(3)
    }
  }

  const handleIssueFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
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
  }

  const handleSubmit = async () => {
    if (!validateLocation()) {
      return
    }

    const payload: CreateRepairRequestPayload = {
      car: {
        vin: normalizeVin(vin) || undefined,
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
    <section className="create-request-flow">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('form.newRequest')}</h1>
          <p className="page-subtitle">{t('form.newRequestSubtitle')}</p>
        </div>
      </div>

      {step < 4 ? (
        <nav className="flow-stepper" aria-label="Form progress">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1
            const isCurrent = step === stepNum
            const isDone = step > stepNum
            const numberClass = isDone
              ? 'flow-step-number flow-step-number-done'
              : isCurrent
                ? 'flow-step-number flow-step-number-current'
                : 'flow-step-number flow-step-number-pending'
            const labelClass =
              isDone || isCurrent ? 'flow-step-label flow-step-label-active' : 'flow-step-label flow-step-label-pending'

            return (
              <div key={label} className="u-contents">
                {index > 0 ? (
                  <div className={`flow-step-line ${isDone ? 'flow-step-line-done' : 'flow-step-line-pending'}`} />
                ) : null}
                <div className="flow-step">
                  <span className={numberClass}>{isDone ? '\u2713' : stepNum}</span>
                  <span className={labelClass}>{label}</span>
                </div>
              </div>
            )
          })}
        </nav>
      ) : null}

      {step === 1 ? (
        <div className="create-request-flow__shell">
          <div className="card">
            <div className="flow-card-body">
              <h3 className="flow-card-title">{t('form.titleCar')}</h3>

              <div className="form-group">
                <label className="form-label" htmlFor="vin-input">
                  {t('form.vin')} <span className="flow-field-hint">({t('form.vinHint')})</span>
                </label>
                <input
                  id="vin-input"
                  className="form-input vin-input"
                  value={vin}
                  onChange={(event) => {
                    setVin(normalizeVin(event.target.value))
                  }}
                  placeholder="WAUZZZ8V9KA101234"
                  maxLength={17}
                />
                {carErrors.vin ? <small className="field-error">{t(carErrors.vin)}</small> : null}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <span className="form-label">{t('form.make')}</span>
                  <CarBrandCombobox value={make} onChange={setMake} />
                  {carErrors.make ? <small className="field-error">{t(carErrors.make)}</small> : null}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="model-input">
                    {t('form.model')}
                  </label>
                  <input
                    id="model-input"
                    className="form-input"
                    value={model}
                    onChange={(event) => {
                      setModel(event.target.value)
                    }}
                    placeholder="A3"
                  />
                  {carErrors.model ? <small className="field-error">{t(carErrors.model)}</small> : null}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="variant-input">
                    {t('form.variant')} <span className="flow-field-hint">({t('form.optional')})</span>
                  </label>
                  <input
                    id="variant-input"
                    className="form-input"
                    value={variant}
                    onChange={(event) => {
                      setVariant(event.target.value)
                    }}
                    placeholder="Sportback"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="year-input">
                    {t('form.year')}
                  </label>
                  <input
                    id="year-input"
                    className="form-input"
                    type="number"
                    value={year}
                    onChange={(event) => {
                      setYear(event.target.value)
                    }}
                    placeholder="2019"
                  />
                  {carErrors.year ? (
                    <small className="field-error">{t(carErrors.year, { min: MIN_CAR_YEAR, max: MAX_CAR_YEAR })}</small>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                className="view-link flow-toggle-link"
                onClick={() => {
                  setShowOptionalCar((previous) => !previous)
                }}
              >
                <PlusIcon />
                {showOptionalCar ? t('form.hideMoreDetails') : t('form.moreDetails')}
              </button>

              {showOptionalCar ? (
                <div className="flow-optional-fields">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="engine-input">
                        {t('form.engineType')}
                      </label>
                      <input
                        id="engine-input"
                        className="form-input"
                        value={engineType}
                        onChange={(event) => {
                          setEngineType(event.target.value)
                        }}
                        placeholder="1.4 TSI"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="fuel-input">
                        {t('form.fuelType')}
                      </label>
                      <input
                        id="fuel-input"
                        className="form-input"
                        value={fuelType}
                        onChange={(event) => {
                          setFuelType(event.target.value)
                        }}
                        placeholder="Petrol"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="mileage-input">
                      {t('form.mileageKm')}
                    </label>
                    <input
                      id="mileage-input"
                      className="form-input"
                      type="number"
                      value={mileageKm}
                      onChange={(event) => {
                        setMileageKm(event.target.value)
                      }}
                      placeholder="112000"
                    />
                    {carErrors.mileageKm ? <small className="field-error">{t(carErrors.mileageKm)}</small> : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flow-actions">
            <div className="u-flex-1" />
            <button className="btn btn-primary" onClick={handleNext}>
              {t('common.next')}
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="create-request-flow__shell">
          <div className="card flow-summary-card">
            <span className="vehicle-icon vehicle-icon-lg flow-summary-card__icon">{getVehicleInitials(make)}</span>
            <div className="flow-summary-card__content">
              <div className="vehicle-name flow-summary-card__title">{vehicleName}</div>
              <div className="vehicle-desc">{vehicleMeta}</div>
            </div>
            <button
              type="button"
              className="view-link"
              onClick={() => {
                setStep(1)
              }}
            >
              {t('form.change')}
            </button>
          </div>

          <div className="card">
            <div className="flow-card-body">
              <h3 className="flow-card-title">{t('form.titleIssue')}</h3>

              <div className="form-group">
                <span className="form-label">{t('form.category')}</span>
                <div className="flow-tag-grid">
                  {ISSUE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`cat-pill ${tags.includes(tag) ? 'cat-pill-selected' : ''}`}
                      onClick={() => {
                        toggleTag(tag)
                      }}
                    >
                      {t(`tags.${tag}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="issue-description">
                  {t('form.issueQuestion')}
                </label>
                <textarea
                  id="issue-description"
                  className="form-input"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value)
                  }}
                  rows={5}
                  placeholder={t('form.issuePlaceholder')}
                />
                {issueErrors.description ? <small className="field-error">{t(issueErrors.description)}</small> : null}
              </div>

              <div className="form-group flow-upload-group">
                <span className="form-label">
                  {t('form.photosLabel')} <span className="flow-field-hint">({t('form.photosOptionalHint')})</span>
                </span>
                <label className="upload-zone flow-upload-zone" htmlFor="issue-file-input">
                  <span className="upload-zone__icon">
                    <ImageIcon />
                  </span>
                  <div className="upload-zone__title">{t('form.uploadTitle')}</div>
                  <div className="upload-zone__hint">{t('form.uploadHint')}</div>
                </label>
                <input
                  id="issue-file-input"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleIssueFilesChange}
                />
                {attachmentError ? <small className="field-error">{t(attachmentError)}</small> : null}
                <AttachmentGrid attachments={issueAttachments} removable onRemove={removeIssueAttachment} />
              </div>
            </div>
          </div>

          <div className="flow-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setStep(1)
              }}
            >
              <ArrowLeftIcon />
              {t('common.back')}
            </button>
            <div className="u-flex-1" />
            <button className="btn btn-primary" onClick={handleNext}>
              {t('common.next')}
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="create-request-flow__shell">
          <div className="card flow-summary-card">
            <span className="vehicle-icon vehicle-icon-lg flow-summary-card__icon">{getVehicleInitials(make)}</span>
            <div className="flow-summary-card__content">
              <div className="vehicle-name flow-summary-card__title">{vehicleNameWithYear}</div>
              <div className="vehicle-desc flow-summary-card__secondary">
                {selectedCategory} · {issuePreview}
              </div>
            </div>
            <span className="badge badge-gray flow-summary-card__badge">{selectedCategory}</span>
          </div>

          <div className="card">
            <div className="flow-card-body">
              <h3 className="flow-card-title">{t('form.titleLocation')}</h3>
              <LocationStep
                autocomplete={autocomplete}
                radiusKm={radiusKm}
                onRadiusChange={setRadiusKm}
                locationErrors={locationErrors}
                isSubmitting={isSubmitting}
                onBack={() => setStep(2)}
                onSubmit={handleSubmit}
                hideActions
              />
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-box__title">{t('form.orderSummary')}</div>
            <div className="summary-row">
              <span className="summary-row__label">{t('home.colVehicle')}</span>
              <span className="summary-row__value">{vehicleNameWithYear}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row__label">{t('form.category')}</span>
              <span className="summary-row__value">{selectedCategory}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row__label">{t('form.descriptionLabel')}</span>
              <span className="summary-row__value">{issuePreview}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row__label">{t('home.colRange')}</span>
              <span className="summary-row__value">{summaryRange}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row__label">{t('form.photosSummary')}</span>
              <span className="summary-row__value">{photoSummary}</span>
            </div>
          </div>

          <div className="flow-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setStep(2)
              }}
            >
              <ArrowLeftIcon />
              {t('common.back')}
            </button>
            <div className="u-flex-1" />
            <span className="flow-actions__hint">{t('form.submitHint')}</span>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              <SendIcon />
              {isSubmitting ? t('form.submitting') : t('form.submitRequest')}
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="create-request-flow__shell">
          <div className="summary-box u-text-center">
            <span className="badge badge-green">
              <span className="badge-dot" />
              {t('status.open')}
            </span>
            <h4 style={{ margin: '12px 0 8px', fontSize: '16px', fontWeight: 500 }}>{t('form.confirmTitle')}</h4>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: '0 0 16px' }}>{t('form.confirmMessage')}</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (submittedRequestId) {
                  onViewRequest(submittedRequestId)
                }
              }}
            >
              {t('form.viewRequest')}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
