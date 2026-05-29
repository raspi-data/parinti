'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type State = 'idle' | 'locating' | 'sending' | 'success' | 'error'

interface Result {
  type: 'IN' | 'OUT'
  distanceM: number | null
  message: string
}

export default function CheckinButton({ contractId }: { contractId: string }) {
  const router = useRouter()
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [errMsg, setErrMsg] = useState('')

  async function handleCheckin(type: 'IN' | 'OUT') {
    setState('locating')
    setErrMsg('')
    setResult(null)

    let lat: number | undefined
    let lng: number | undefined

    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10_000,
          }),
        )
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch {
        // Permission denied or unavailable — proceed without location (server skips geofencing)
      }
    }

    setState('sending')

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, type, lat, lng }),
      })
      const data = await res.json()

      if (!res.ok) {
        setState('error')
        setErrMsg(data.error ?? 'Eroare la înregistrare')
        return
      }

      setResult({
        type,
        distanceM: data.distanceM ?? null,
        message: type === 'IN' ? 'Sosire înregistrată' : 'Plecare înregistrată',
      })
      setState('success')
      router.refresh()
    } catch {
      setState('error')
      setErrMsg('Eroare de rețea — încearcă din nou')
    }
  }

  function reset() {
    setState('idle')
    setResult(null)
    setErrMsg('')
  }

  if (state === 'locating') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
        <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
        Obțin locația...
      </div>
    )
  }

  if (state === 'sending') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
        <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin inline-block" />
        Se înregistrează...
      </div>
    )
  }

  if (state === 'success' && result) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg ${result.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
            <span>{result.type === 'IN' ? '✓' : '↗'}</span>
            {result.message}
          </span>
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 underline">
            Nou
          </button>
        </div>
        {result.distanceM != null && (
          <p className="text-xs text-gray-400">Distanță față de adresă: {result.distanceM} m</p>
        )}
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="space-y-1">
        <p className="text-sm text-red-600">{errMsg}</p>
        <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-700 underline">
          Încearcă din nou
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleCheckin('IN')}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm"
      >
        <span className="text-base">📍</span>
        Check-in
      </button>
      <button
        onClick={() => handleCheckin('OUT')}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium text-sm shadow-sm"
      >
        <span className="text-base">↗</span>
        Check-out
      </button>
    </div>
  )
}
