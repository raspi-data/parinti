'use client'

import { useEffect, useRef } from 'react'

const CDN_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
const CDN_JS  = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'

interface Props {
  seniorLat:  number | null
  seniorLng:  number | null
  checkinLat: number | null
  checkinLng: number | null
  distanceM:  number | null
}

// Leaflet loaded from CDN attaches to window.L
declare global {
  interface Window { L: typeof import('leaflet') }
}

function loadLeaflet(): Promise<typeof import('leaflet')> {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = CDN_CSS
      document.head.appendChild(link)
    }

    if (document.getElementById('leaflet-js')) {
      // Script tag present but L not yet ready — wait for its load event
      document.getElementById('leaflet-js')!.addEventListener('load', () => resolve(window.L), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'leaflet-js'; script.src = CDN_JS
    script.onload = () => resolve(window.L)
    document.head.appendChild(script)
  })
}

// Coloured circle marker (no default-icon path issues)
function circleIcon(L: typeof import('leaflet'), color: string, size = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 1px 5px rgba(0,0,0,.4)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function ContractMap({ seniorLat, seniorLng, checkinLat, checkinLng, distanceM }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapInst = useRef<ReturnType<typeof window.L.map> | null>(null)

  useEffect(() => {
    if (!checkinLat || !checkinLng) return   // nothing to show
    let alive = true

    loadLeaflet().then((L) => {
      if (!alive || !mapRef.current || mapInst.current) return

      const center: [number, number] = [checkinLat, checkinLng]
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
        .setView(center, 16)
      mapInst.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      // Green pin — last check-in
      L.marker([checkinLat, checkinLng], { icon: circleIcon(L, '#10b981') })
        .bindTooltip(distanceM != null ? `Check-in (${distanceM} m față de adresă)` : 'Locație check-in')
        .addTo(map)

      if (seniorLat && seniorLng) {
        // Blue transparent 200m geofence circle
        L.circle([seniorLat, seniorLng], {
          radius: 300, color: '#2563eb', weight: 2,
          fillColor: '#2563eb', fillOpacity: 0.08,
        }).addTo(map)

        // Red pin — senior home
        L.marker([seniorLat, seniorLng], { icon: circleIcon(L, '#dc2626', 12) })
          .bindTooltip('Adresa seniorului')
          .addTo(map)

        map.fitBounds(
          [[seniorLat, seniorLng], [checkinLat, checkinLng]],
          { padding: [40, 40] },
        )
      }
    })

    return () => {
      alive = false
      mapInst.current?.remove()
      mapInst.current = null
    }
  }, [seniorLat, seniorLng, checkinLat, checkinLng, distanceM])

  if (!checkinLat || !checkinLng) {
    return (
      <div className="h-[250px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 gap-2">
        <span className="text-2xl">📍</span>
        <p className="text-sm">Locație indisponibilă</p>
        <p className="text-xs text-center px-6">
          Îngrijitorul nu a trimis coordonate GPS la ultimul check-in.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div ref={mapRef} className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-200" />
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          Locație check-in{distanceM != null ? ` (${distanceM} m)` : ''}
        </span>
        {seniorLat && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            Adresa seniorului (raza 200 m)
          </span>
        )}
      </div>
    </div>
  )
}
