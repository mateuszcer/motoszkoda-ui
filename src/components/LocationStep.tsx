import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_RADIUS_KM, MIN_RADIUS_KM } from '../domain/constants'
import type { GeocodedAddress, useAddressAutocomplete } from '../hooks/useAddressAutocomplete'
import { LocationMap } from './LocationMap'

type LocationStatus = 'empty' | 'resolving' | 'set' | 'adjusted' | 'error'

interface LocationStepProps {
  autocomplete: ReturnType<typeof useAddressAutocomplete>
  radiusKm: number
  onRadiusChange: (value: number) => void
  locationErrors: { address?: string; radiusKm?: string }
  isSubmitting: boolean
  onBack: () => void
  onSubmit: () => void
  hideActions?: boolean
}

const DEFAULT_RADIUS_OPTIONS = [5, 10, 15, 25, 50, 100]

export function LocationStep({
  autocomplete,
  radiusKm,
  onRadiusChange,
  locationErrors,
  isSubmitting,
  onBack,
  onSubmit,
  hideActions = false,
}: LocationStepProps) {
  const { t } = useTranslation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [geolocating, setGeolocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(autocomplete.selected ? 'set' : 'empty')
  const [geoError, setGeoError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const reverseAbortRef = useRef<AbortController | null>(null)

  const radiusOptions = useMemo(
    () =>
      Array.from(new Set([MIN_RADIUS_KM, MAX_RADIUS_KM, radiusKm, ...DEFAULT_RADIUS_OPTIONS]))
        .filter((value) => value >= MIN_RADIUS_KM && value <= MAX_RADIUS_KM)
        .sort((a, b) => a - b),
    [radiusKm],
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (autocomplete.selected && locationStatus === 'empty') {
      setLocationStatus('set')
    }
  }, [autocomplete.selected, locationStatus])

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return
    setGeolocating(true)
    setLocationStatus('resolving')
    setGeoError(null)
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
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
            headers: { 'Accept-Language': 'pl,en' },
          })
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
            setLocationStatus('set')
          }
        } catch {
          autocomplete.pick({
            displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            lat,
            lon,
          })
          setLocationStatus('set')
        } finally {
          setGeolocating(false)
        }
      },
      () => {
        setGeolocating(false)
        setLocationStatus('error')
        setGeoError(t('form.geolocationDenied'))
      },
    )
  }

  const handlePick = (suggestion: GeocodedAddress) => {
    autocomplete.pick(suggestion)
    setShowDropdown(false)
    setLocationStatus('set')
    setGeoError(null)
  }

  const handleInputChange = (value: string) => {
    autocomplete.setQuery(value)
    setShowDropdown(true)
    if (autocomplete.selected) {
      autocomplete.clear()
      autocomplete.setQuery(value)
      setLocationStatus('empty')
    }
    if (!value.trim()) {
      setLocationStatus('empty')
    }
    setGeoError(null)
  }

  const handlePinDragEnd = (lat: number, lon: number) => {
    reverseAbortRef.current?.abort()
    const controller = new AbortController()
    reverseAbortRef.current = controller

    autocomplete.pick({
      displayName: autocomplete.selected?.displayName ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      lat,
      lon,
      street: undefined,
      city: autocomplete.selected?.city,
    })
    setLocationStatus('adjusted')

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1',
    })
    fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'pl,en' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || controller.signal.aborted) return
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
      })
      .catch(() => {
        // Ignore abort errors
      })
  }

  const isLocationSet = locationStatus === 'set' || locationStatus === 'adjusted'
  const showCityCenterHint = isLocationSet && autocomplete.selected && !autocomplete.selected.street
  const showNoResults =
    !autocomplete.loading &&
    autocomplete.query.length >= 3 &&
    autocomplete.suggestions.length === 0 &&
    !autocomplete.selected &&
    showDropdown

  return (
    <div className="location-step">
      <div className="form-grid-2 location-step__controls">
        <label className="location-step__field">
          <span className="form-label">{t('form.searchRadius')}</span>
          <select
            className="form-input"
            value={radiusKm}
            onChange={(event) => onRadiusChange(Number.parseInt(event.target.value, 10))}
          >
            {radiusOptions.map((value) => (
              <option key={value} value={value}>
                {value} km
              </option>
            ))}
          </select>
          <small className="u-text-muted">{t('form.radiusHelp', { radius: radiusKm })}</small>
          {locationErrors.radiusKm ? (
            <small className="field-error">
              {t(locationErrors.radiusKm, { min: MIN_RADIUS_KM, max: MAX_RADIUS_KM })}
            </small>
          ) : null}
        </label>

        <div className="address-autocomplete location-step__field" ref={dropdownRef}>
          <label className="form-label" htmlFor="location-address-input">
            {t('form.addressLabel')}
          </label>
          <div className="location-step__address-row">
            <div className="address-input-wrap location-step__address-input">
              <input
                id="location-address-input"
                type="text"
                value={autocomplete.query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => {
                  if (autocomplete.suggestions.length > 0) setShowDropdown(true)
                }}
                placeholder={t('form.addressPlaceholder')}
                autoComplete="off"
              />
              {autocomplete.loading ? <span className="address-spinner" /> : null}
            </div>
            <button
              type="button"
              className="location-step__current-button"
              onClick={handleUseCurrentLocation}
              disabled={geolocating}
              title={geolocating ? t('form.locating') : t('form.useCurrentLocation')}
              aria-label={geolocating ? t('form.locating') : t('form.useCurrentLocation')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </button>
          </div>
          {locationErrors.address ? <small className="field-error">{t(locationErrors.address)}</small> : null}

          {showDropdown && autocomplete.suggestions.length > 0 ? (
            <ul className="address-suggestions">
              {autocomplete.suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button type="button" onClick={() => handlePick(suggestion)}>
                    {suggestion.displayName}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {showNoResults ? <div className="location-error">{t('form.noResults')}</div> : null}
      {geoError ? <div className="location-error">{geoError}</div> : null}
      {locationStatus === 'adjusted' ? <div className="location-hint">{t('form.locationAdjusted')}</div> : null}

      {isLocationSet && autocomplete.selected ? (
        <div className="location-map-wrap">
          <LocationMap
            lat={autocomplete.selected.lat}
            lon={autocomplete.selected.lon}
            radiusKm={radiusKm}
            onPinDragEnd={handlePinDragEnd}
          />
        </div>
      ) : (
        <p className="location-hint-muted">{t('form.radiusHiddenHint')}</p>
      )}

      {showCityCenterHint ? <div className="location-hint">{t('form.cityCenterHint')}</div> : null}

      {!hideActions ? (
        <div className="sticky-cta u-flex u-gap-3">
          <button className="btn btn-ghost" onClick={onBack}>
            {t('common.back')}
          </button>
          <button className="btn btn-primary btn-lg u-flex-1" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('form.submitting') : t('form.submitRequest')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
