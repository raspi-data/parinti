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

interface Props {
  onClose: () => void
  initial: {
    nume: string
    phone: string
    judet: string
    bio: string
    tarif: number
    experienta: number
    disponibil: boolean
  }
}

export default function EditProfileModal({ onClose, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    nume: initial.nume || '',
    phone: initial.phone || '',
    judet: initial.judet || '',
    bio: initial.bio || '',
    tarif: String(initial.tarif || ''),
    experienta: String(initial.experienta || ''),
    disponibil: initial.disponibil ?? true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/caregiver/profile', {
      method: 'PATCH',
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
    <Modal title="Editeaza Profilul" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.nume} onChange={set('nume')} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
            <input
              type="tel"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.phone} onChange={set('phone')} required placeholder="07xx xxx xxx"
            />
          </div>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarif (RON/zi) *</label>
            <input
              type="number" min="0" step="10"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.tarif} onChange={set('tarif')} required placeholder="150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experienta (ani) *</label>
            <input
              type="number" min="0" max="50"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.experienta} onChange={set('experienta')} required placeholder="3"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descriere / Bio</label>
          <textarea
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={form.bio} onChange={set('bio')}
            placeholder="Descrie experienta si abordarea ta..."
          />
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Disponibil pentru noi contracte</p>
            <p className="text-xs text-gray-400">Familiile te pot contacta doar daca esti disponibil</p>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, disponibil: !f.disponibil }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.disponibil ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.disponibil ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
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
            {loading ? 'Se salveaza...' : 'Salveaza'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
