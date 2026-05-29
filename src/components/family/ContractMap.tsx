'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface Props {
  seniorLat: number
  seniorLng: number
  checkinLat: number | null
  checkinLng: number | null
  distanceM: number | null
}

export default function ContractMap({ seniorLat, seniorLng, checkinLat, checkinLng, distanceM }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapInst = useRef<{ remove: () => void } | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return

    import('leaflet').then((mod) => {
      if (!mapRef.current) return
      const L = mod.default

      const center: [number, number] = checkinLat && checkinLng
        ? [checkinLat, checkinLng]
        : [seniorLat, seniorLng]

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
        .setView(center, 16)

      mapInst.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Senior location — 200m geofence circle
      L.circle([seniorLat, seniorLng], {
        radius: 200,
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(map)

      // Senior pin
      const homeIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      L.marker([seniorLat, seniorLng], { icon: homeIcon })
        .bindTooltip('Adresa seniorului', { permanent: false })
        .addTo(map)

      // Last check-in pin
      if (checkinLat && checkinLng) {
        const caregiverIcon = L.divIcon({
          className: '',
          html: `<div style="width:12px;height:12px;background:#10b981;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })
        L.marker([checkinLat, checkinLng], { icon: caregiverIcon })
          .bindTooltip(distanceM != null ? `Îngrijitor (${distanceM}m)` : 'Îngrijitor', { permanent: false })
          .addTo(map)

        // Fit bounds to show both
        map.fitBounds(
          [[seniorLat, seniorLng], [checkinLat, checkinLng]],
          { padding: [30, 30] },
        )
      }
    })

    return () => {
      mapInst.current?.remove()
      mapInst.current = null
    }
  }, [seniorLat, seniorLng, checkinLat, checkinLng, distanceM])

  return (
    <div className="space-y-1">
      <div ref={mapRef} className="h-48 w-full rounded-lg overflow-hidden border border-gray-200" />
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
          Adresa senior (raza 200m)
        </span>
        {checkinLat && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            Locație check-in{distanceM != null ? ` (${distanceM}m)` : ''}
          </span>
        )}
      </div>
    </div>
  )
}
