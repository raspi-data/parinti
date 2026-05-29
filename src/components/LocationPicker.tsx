'use client'

import { useEffect, useRef } from 'react'

const CDN_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
const CDN_JS  = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'

declare global {
  interface Window { L: typeof import('leaflet') }
}

interface Props {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  height?: number
  zoom?: number
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
      document.getElementById('leaflet-js')!.addEventListener('load', () => resolve(window.L), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = 'leaflet-js'; script.src = CDN_JS
    script.onload = () => resolve(window.L)
    document.head.appendChild(script)
  })
}

const BUCHAREST: [number, number] = [44.4268, 26.1025]

export default function LocationPicker({ lat, lng, onChange, height = 220, zoom = 15 }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInst     = useRef<ReturnType<typeof window.L.map> | null>(null)
  const markerRef   = useRef<ReturnType<typeof window.L.marker> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Initial mount
  useEffect(() => {
    if (!mapRef.current) return
    let alive = true

    loadLeaflet().then((L) => {
      if (!alive || !mapRef.current || mapInst.current) return

      const center: [number, number] = lat && lng ? [lat, lng] : BUCHAREST
      const initZoom = lat && lng ? zoom : 7

      const map = L.map(mapRef.current, { attributionControl: false, zoomControl: true })
        .setView(center, initZoom)
      mapInst.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:20px;height:20px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:grab"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      })

      const marker = L.marker(center, { draggable: true, icon }).addTo(map)
      markerRef.current = marker

      marker.on('dragend', () => {
        const p = marker.getLatLng()
        onChangeRef.current(p.lat, p.lng)
      })

      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        marker.setLatLng(e.latlng)
        onChangeRef.current(e.latlng.lat, e.latlng.lng)
      })
    })

    return () => {
      alive = false
      mapInst.current?.remove()
      mapInst.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep marker in sync when coords change externally (geocoding result)
  useEffect(() => {
    if (!mapInst.current || !markerRef.current || lat == null || lng == null) return
    const newPos: [number, number] = [lat, lng]
    markerRef.current.setLatLng(newPos)
    mapInst.current.setView(newPos, zoom, { animate: true })
  }, [lat, lng, zoom])

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className="w-full rounded-lg border border-gray-200 overflow-hidden"
    />
  )
}
