import { useCallback, useEffect, useRef, useState } from 'react'

export interface GeocodedAddress {
  displayName: string
  lat: number
  lon: number
  street?: string
  city?: string
  postcode?: string
}

interface NominatimAddress {
  road?: string
  house_number?: string
  city?: string
  town?: string
  village?: string
  postcode?: string
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 3

export function useAddressAutocomplete() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodedAddress[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<GeocodedAddress | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'pl',
      })
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'pl,en' },
      })
      if (!res.ok) throw new Error('Nominatim request failed')
      const data: NominatimResult[] = await res.json()
      setSuggestions(
        data.map((r) => {
          const a = r.address
          const street = a ? [a.road, a.house_number].filter(Boolean).join(' ') : undefined
          const city = a?.city ?? a?.town ?? a?.village
          return {
            displayName: r.display_name,
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon),
            street: street || undefined,
            city: city || undefined,
            postcode: a?.postcode || undefined,
          }
        }),
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setSuggestions([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      return
    }

    timerRef.current = setTimeout(() => {
      void search(query)
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, search])

  const pick = useCallback((addr: GeocodedAddress) => {
    setSelected(addr)
    setQuery(addr.displayName)
    setSuggestions([])
  }, [])

  const clear = useCallback(() => {
    setSelected(null)
    setQuery('')
    setSuggestions([])
  }, [])

  return { query, setQuery, suggestions, loading, selected, pick, clear }
}
