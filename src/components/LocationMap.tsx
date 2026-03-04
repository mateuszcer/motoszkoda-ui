import { useEffect, useMemo, useRef } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default marker icon (broken by bundlers)
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

interface LocationMapProps {
  lat: number
  lon: number
  radiusKm: number
  onPinDragEnd: (lat: number, lon: number) => void
}

function RecenterMap({ lat, lon, radiusKm }: { lat: number; lon: number; radiusKm: number }) {
  const map = useMap()
  const initialRef = useRef(true)
  const prevRef = useRef({ lat, lon, radiusKm })

  useEffect(() => {
    const bounds = L.latLng(lat, lon).toBounds(radiusKm * 1000 * 2)

    if (initialRef.current) {
      initialRef.current = false
      map.fitBounds(bounds, { padding: [20, 20], animate: false })
      return
    }

    const prev = prevRef.current
    const coordsChanged = prev.lat !== lat || prev.lon !== lon

    if (coordsChanged) {
      map.flyTo([lat, lon], map.getZoom(), { duration: 0.6 })
    } else {
      map.fitBounds(bounds, { padding: [20, 20], animate: true })
    }

    prevRef.current = { lat, lon, radiusKm }
  }, [lat, lon, radiusKm, map])

  return null
}

function DraggableMarker({
  lat,
  lon,
  onDragEnd,
}: {
  lat: number
  lon: number
  onDragEnd: (lat: number, lon: number) => void
}) {
  const markerRef = useRef<L.Marker>(null)

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker) {
          const pos = marker.getLatLng()
          onDragEnd(pos.lat, pos.lng)
        }
      },
    }),
    [onDragEnd],
  )

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={[lat, lon]}
      ref={markerRef}
    />
  )
}

export function LocationMap({ lat, lon, radiusKm, onPinDragEnd }: LocationMapProps) {
  const mapRef = useRef<L.Map>(null)

  // Read brand color from CSS custom property (Leaflet doesn't resolve CSS vars)
  const brandColor = useMemo(() => {
    if (typeof document === 'undefined') return '#2563eb'
    const style = getComputedStyle(document.documentElement)
    return style.getPropertyValue('--brand-600').trim() || '#2563eb'
  }, [])

  // Invalidate map size after mount animation
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 350)
    return () => clearTimeout(timer)
  }, [])

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={11}
      scrollWheelZoom={false}
      className="location-map"
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker lat={lat} lon={lon} onDragEnd={onPinDragEnd} />
      <Circle
        center={[lat, lon]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: brandColor,
          fillColor: brandColor,
          fillOpacity: 0.1,
          weight: 2,
        }}
      />
      <RecenterMap lat={lat} lon={lon} radiusKm={radiusKm} />
    </MapContainer>
  )
}
