'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'
import LocationPicker from '@/components/LocationPicker'

const JUDETE = [
  'Alba','Arad','Arges','Bacau','Bihor','Bistrita-Nasaud','Botosani','Braila','Brasov',
  'Bucuresti','Buzau','Calarasi','Caras-Severin','Cluj','Constanta','Covasna','Dambovita',
  'Dolj','Galati','Giurgiu','Gorj','Harghita','Hunedoara','Ialomita','Iasi','Ilfov',
  'Maramures','Mehedinti','Mures','Neamt','Olt','Prahova','Salaj','Satu Mare','Sibiu',
  'Suceava','Teleorman','Timis','Tulcea','Valcea','Vaslui','Vrancea',
]

type GeoStatus = 'idle' | 'loading' | 'found' | 'notfound' | 'error'

export default function AddSeniorModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    nume: '', varsta: '', judet: '', adresa: '', nevoi: '', conditii: '',
  })
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  // Debounced geocoding when adresa or judet changes
  useEffect(() => {
    if (!form.adresa || form.adresa.length < 5 || !form.judet) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => geocode(form.adresa, form.judet), 900)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [form.adresa, form.judet])

  async function geocode(adresa: string, judet: string) {
    setGeoStatus('loading')
    try {
      const q = encodeURIComponent(`${adresa}, ${judet}, Romania`)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`)
      const data = await res.json() as Array<{ lat: string; lon: string }>
      if (data.length) {
        setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
        setGeoStatus('found')
      } else {
        setGeoStatus('notfound')
      }
    } catch {
      setGeoStatus('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/seniors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, lat: coords?.lat ?? null, lng: coords?.lng ?? null }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Eroare la salvare')
      return
    }
    router.refresh()
    onClose()
  }

  const geoMessage: Record<GeoStatus, string | null> = {
    idle:     null,
    loading:  'Se caută adresa...',
    found:    'Locație găsită — poți trage pinul pentru precizie mai mare',
    notfound: 'Adresa nu a fost găsită — trage pinul manual pe hartă',
    error:    'Eroare geocodare — trage pinul manual pe hartă',
  }

  return (
    <Modal title="Adaugă Senior" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Left column — form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.nume} onChange={set('nume')} required placeholder="Ion Popescu"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vârstă *</label>
                <input
                  type="number" min="50" max="120"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.varsta} onChange={set('varsta')} required placeholder="78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Județ *</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.judet} onChange={set('judet')} required
                >
                  <option value="">Selectează</option>
                  {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresă completă *
              </label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.adresa} onChange={set('adresa')} required
                placeholder="Str. Florilor nr. 5, ap. 2, Sector 3"
              />
              <div className="flex items-center gap-2 mt-1.5">
                {geoStatus !== 'idle' && (
                  <span className={`text-xs ${
                    geoStatus === 'found'    ? 'text-emerald-600' :
                    geoStatus === 'loading'  ? 'text-blue-500 animate-pulse' :
                    'text-amber-600'
                  }`}>
                    {geoMessage[geoStatus]}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => geocode(form.adresa, form.judet)}
                  disabled={!form.adresa || !form.judet || geoStatus === 'loading'}
                  className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-40 disabled:no-underline shrink-0"
                >
                  Verifică locația pe hartă
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nevoi de îngrijire *</label>
              <textarea
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={form.nevoi} onChange={set('nevoi')} required
                placeholder="asistență la mers, administrare medicamente..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condiții medicale</label>
              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={form.conditii} onChange={set('conditii')}
                placeholder="diabet, hipertensiune... (opțional)"
              />
            </div>
          </div>

          {/* Right column — map */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locație pe hartă
              {coords && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              )}
            </label>
            <LocationPicker
              lat={coords?.lat ?? null}
              lng={coords?.lng ?? null}
              onChange={(lat, lng) => { setCoords({ lat, lng }); setGeoStatus('found') }}
              height={320}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Trage pinul sau dă click pe hartă pentru a ajusta locația manual.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button" onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Anulează
          </button>
          <button
            type="submit" disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Se salvează...' : 'Adaugă Senior'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
