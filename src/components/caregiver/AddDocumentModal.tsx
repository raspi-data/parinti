'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'

const DOC_TYPES = [
  { value: 'CI', label: 'Carte de identitate' },
  { value: 'CAZIER', label: 'Cazier judiciar' },
  { value: 'CERTIFICAT_ANC', label: 'Certificat ANC ingrijitor' },
  { value: 'CPR', label: 'Certificat CPR / prim ajutor' },
  { value: 'ALTELE', label: 'Alte documente' },
]

export default function AddDocumentModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ type: '', fileUrl: '', expiresAt: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        fileUrl: form.fileUrl,
        expiresAt: form.expiresAt || null,
      }),
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
    <Modal title="Adauga Document" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tip document *</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.type} onChange={set('type')} required
          >
            <option value="">Selecteaza tipul</option>
            {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link document *</label>
          <input
            type="url"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.fileUrl} onChange={set('fileUrl')} required
            placeholder="https://drive.google.com/..."
          />
          <p className="text-xs text-gray-400 mt-1">Incarca documentul pe Google Drive sau alt serviciu si adauga linkul</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data expirare</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.expiresAt} onChange={set('expiresAt')}
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-xs text-gray-400 mt-1">Lasa gol daca documentul nu expira</p>
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
            {loading ? 'Se trimite...' : 'Adauga Document'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
