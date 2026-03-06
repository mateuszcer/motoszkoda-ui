import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MIN_RADIUS_KM, MAX_RADIUS_KM } from '../domain/constants'
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
}

export function LocationStep({
  autocomplete,
  radiusKm,
  onRadiusChange,
  locationErrors,
  isSubmitting,
  onBack,
  onSubmit,
}: LocationStepProps) {
  const { t } = useTranslation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [geolocating, setGeolocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(
    autocomplete.selected ? 'set' : 'empty',
  )
  const [geoError, setGeoError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const reverseAbortRef = useRef<AbortController | null>(null)

  // Outside-click handler for dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sync status when selected changes externally
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

  const handlePick = (s: GeocodedAddress) => {
    autocomplete.pick(s)
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
    // Cancel any in-flight reverse geocode
    reverseAbortRef.current?.abort()
    const controller = new AbortController()
    reverseAbortRef.current = controller

    // Immediately update coords
    autocomplete.pick({
      displayName: autocomplete.selected?.displayName ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      lat,
      lon,
      street: undefined,
      city: autocomplete.selected?.city,
    })
    setLocationStatus('adjusted')

    // Background reverse-geocode to update the label
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
    <div className="form-grid">
      <div className="address-autocomplete" ref={dropdownRef}>
        <label>
          {t('form.addressLabel')}
          <div className="address-input-wrap">
            <input
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
          {locationErrors.address ? (
            <small className="field-error">{t(locationErrors.address)}</small>
          ) : null}
        </label>

        {showDropdown && autocomplete.suggestions.length > 0 ? (
          <ul className="address-suggestions">
            {autocomplete.suggestions.map((s, i) => (
              <li key={i}>
                <button type="button" onClick={() => handlePick(s)}>
                  {s.displayName}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {showNoResults ? (
          <div className="location-error">{t('form.noResults')}</div>
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

      {geoError ? (
        <div className="location-error">{geoError}</div>
      ) : null}

      {locationStatus === 'adjusted' ? (
        <div className="location-hint">
          {t('form.locationAdjusted')}
        </div>
      ) : null}

      {isLocationSet && autocomplete.selected ? (
        <div className="location-map-wrap">
          <LocationMap
            lat={autocomplete.selected.lat}
            lon={autocomplete.selected.lon}
            radiusKm={radiusKm}
            onPinDragEnd={handlePinDragEnd}
          />
        </div>
      ) : null}

      {showCityCenterHint ? (
        <div className="location-hint">
          {t('form.cityCenterHint')}
        </div>
      ) : null}

      {isLocationSet ? (
        <label>
          {t('form.searchRadius')} <strong>{radiusKm} km</strong>
          <input
            type="range"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            value={radiusKm}
            onChange={(event) => onRadiusChange(Number.parseInt(event.target.value, 10))}
          />
          <small style={{ color: 'var(--neutral-500)' }}>
            {t('form.radiusHelp', { radius: radiusKm })}
          </small>
          {locationErrors.radiusKm ? (
            <small className="field-error">
              {t(locationErrors.radiusKm, { min: MIN_RADIUS_KM, max: MAX_RADIUS_KM })}
            </small>
          ) : null}
        </label>
      ) : (
        <p className="location-hint-muted">{t('form.radiusHiddenHint')}</p>
      )}

      <div className="sticky-cta" style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button className="btn btn-ghost" onClick={onBack}>
          {t('common.back')}
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={onSubmit}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        >
          {isSubmitting ? t('form.submitting') : t('form.submitRequest')}
        </button>
      </div>
    </div>
  )
}
