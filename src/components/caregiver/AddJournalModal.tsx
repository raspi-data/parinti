'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'

interface Props {
  contractId: string
  seniorNume: string
  onClose: () => void
}

export default function AddJournalModal({ contractId, seniorNume, onClose }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId, text }),
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
    <Modal title={`Jurnal — ${seniorNume}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nota de ingrijire *
          </label>
          <textarea
            rows={6}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            placeholder="Descrie activitatile de astazi, starea seniorului, medicamente administrate, observatii importante..."
          />
          <p className="text-xs text-gray-400 mt-1">{text.length} caractere</p>
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
            type="submit" disabled={loading || !text.trim()}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Se salveaza...' : 'Salveaza Nota'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
