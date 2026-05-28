'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'

const JUDETE = [
  'Alba','Arad','Arges','Bacau','Bihor','Bistrita-Nasaud','Botosani','Braila','Brasov',
  'Bucuresti','Buzau','Calarasi','Caras-Severin','Cluj','Constanta','Covasna','Dambovita',
  'Dolj','Galati','Giurgiu','Gorj','Harghita','Hunedoara','Ialomita','Iasi','Ilfov',
  'Maramures','Mehedinti','Mures','Neamt','Olt','Prahova','Salaj','Satu Mare','Sibiu',
  'Suceava','Teleorman','Timis','Tulcea','Valcea','Vaslui','Vrancea',
]

export default function AddSeniorModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    nume: '', varsta: '', judet: '', adresa: '', nevoi: '', conditii: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/seniors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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

  return (
    <Modal title="Adauga Senior" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet *</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.nume} onChange={set('nume')} required placeholder="ex: Ion Popescu"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Varsta *</label>
            <input
              type="number" min="50" max="120"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.varsta} onChange={set('varsta')} required placeholder="75"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judet *</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.judet} onChange={set('judet')} required
            >
              <option value="">Selecteaza</option>
              {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresa *</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.adresa} onChange={set('adresa')} required placeholder="Str. Florilor nr. 5, ap. 2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nevoi de ingrijire *</label>
          <textarea
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={form.nevoi} onChange={set('nevoi')} required
            placeholder="ex: asistenta la mers, administrare medicamente, companie..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conditii medicale</label>
          <textarea
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={form.conditii} onChange={set('conditii')}
            placeholder="ex: diabet, hipertensiune, dementa (optional)"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button" onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Anuleaza
          </button>
          <button
            type="submit" disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Se salveaza...' : 'Adauga Senior'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
