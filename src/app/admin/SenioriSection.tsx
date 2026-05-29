'use client'

import { useState } from 'react'
import LocationPicker from '@/components/LocationPicker'

export interface SeniorRow {
  id: string
  nume: string
  judet: string
  adresa: string
  varsta: number
  lat: number | null
  lng: number | null
}

export default function SenioriSection({ seniors }: { seniors: SeniorRow[] }) {
  const [editing, setEditing]       = useState<SeniorRow | null>(null)
  const [coords, setCoords]         = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving]         = useState(false)
  const [resetting, setResetting]   = useState<string | null>(null)
  const [msg, setMsg]               = useState<{ id: string; text: string; ok: boolean } | null>(null)
  const [localSeniors, setLocal]    = useState<SeniorRow[]>(seniors)

  function openEdit(s: SeniorRow) {
    setEditing(s)
    setCoords(s.lat && s.lng ? { lat: s.lat, lng: s.lng } : null)
    setMsg(null)
  }

  async function saveLocation() {
    if (!editing || !coords) return
    setSaving(true)
    const res = await fetch(`/api/admin/seniors/${editing.id}/location`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coords),
    })
    setSaving(false)
    if (res.ok) {
      setLocal((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...coords } : s))
      setMsg({ id: editing.id, text: 'Locație salvată', ok: true })
      setEditing(null)
    } else {
      setMsg({ id: editing.id, text: 'Eroare la salvare', ok: false })
    }
  }

  async function resetLocation(s: SeniorRow) {
    setResetting(s.id)
    setMsg(null)
    const res = await fetch(`/api/admin/seniors/${s.id}/location`, { method: 'DELETE' })
    setResetting(null)
    if (res.ok) {
      const updated = await res.json() as { lat: number; lng: number }
      setLocal((prev) => prev.map((x) => x.id === s.id ? { ...x, lat: updated.lat, lng: updated.lng } : x))
      setMsg({ id: s.id, text: `Geocodat: ${updated.lat.toFixed(5)}, ${updated.lng.toFixed(5)}`, ok: true })
    } else {
      const d = await res.json()
      setMsg({ id: s.id, text: d.error ?? 'Eroare geocodare', ok: false })
    }
  }

  return (
    <div className="space-y-3">
      {localSeniors.map((s) => (
        <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium text-gray-900">{s.nume}, {s.varsta} ani</p>
              <p className="text-sm text-gray-500">{s.judet} &bull; {s.adresa}</p>
              {s.lat && s.lng ? (
                <p className="text-xs text-emerald-600 mt-1">
                  📍 {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                </p>
              ) : (
                <p className="text-xs text-amber-600 mt-1">⚠ Fără coordonate GPS</p>
              )}
              {msg?.id === s.id && (
                <p className={`text-xs mt-1 ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>{msg.text}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => resetLocation(s)}
                disabled={resetting === s.id}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
              >
                {resetting === s.id ? 'Se geocodează...' : '↺ Resetează locația'}
              </button>
              <button
                onClick={() => openEdit(s)}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Editează pe hartă
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Editează locație</h2>
                <p className="text-sm text-gray-500">{editing.nume} &bull; {editing.adresa}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <LocationPicker
                lat={coords?.lat ?? null}
                lng={coords?.lng ?? null}
                onChange={(lat, lng) => setCoords({ lat, lng })}
                height={300}
              />
              {coords && (
                <p className="text-xs text-gray-500">
                  Coordonate selectate: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Trage pinul sau dă click pe hartă pentru a seta locația exactă.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Anulează
                </button>
                <button
                  onClick={saveLocation}
                  disabled={!coords || saving}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Se salvează...' : 'Salvează locația'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
