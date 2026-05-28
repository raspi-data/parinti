'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  caregiverId: string
  caregiverNume: string
  seniors: Array<{ id: string; nume: string; varsta: number }>
}

export default function SolicitaForm({ caregiverId, caregiverNume, seniors }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedSeniorId, setSelectedSeniorId] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualAge, setManualAge] = useState('')
  const [program, setProgram] = useState('')
  const [startDate, setStartDate] = useState('')
  const [message, setMessage] = useState('')

  const useManual = !seniors.length || selectedSeniorId === '__nou__'
  const selectedSenior = seniors.find((s) => s.id === selectedSeniorId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const seniorName = useManual ? manualName : selectedSenior?.nume ?? ''
    const seniorAge = useManual ? parseInt(manualAge) : selectedSenior?.varsta ?? 0

    const res = await fetch('/api/requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caregiverId, seniorName, seniorAge, program, startDate, message }),
    })

    setLoading(false)

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Eroare la trimitere')
      return
    }

    setSent(true)
    router.refresh()
  }

  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
        <p className="font-semibold text-emerald-800 text-lg mb-1">Cerere trimisă!</p>
        <p className="text-emerald-600 text-sm">
          {caregiverNume} are 24 de ore să răspundă. Vei primi un email imediat ce acceptă.
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors"
      >
        Solicită îngrijitor
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 border border-gray-200 rounded-xl p-5">
      <p className="font-semibold text-gray-900">Cerere către {caregiverNume}</p>

      {seniors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senior</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedSeniorId}
            onChange={(e) => setSelectedSeniorId(e.target.value)}
            required={!useManual}
          >
            <option value="">Selectează seniorul</option>
            {seniors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nume} ({s.varsta} ani)
              </option>
            ))}
            <option value="__nou__">+ Adaugă altul</option>
          </select>
        </div>
      )}

      {useManual && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume senior *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={manualName} onChange={(e) => setManualName(e.target.value)}
              required placeholder="Ion Popescu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vârstă *</label>
            <input
              type="number" min="50" max="120"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={manualAge} onChange={(e) => setManualAge(e.target.value)}
              required placeholder="78"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program dorit *</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={program} onChange={(e) => setProgram(e.target.value)}
            required placeholder="Luni–Vineri, 8–16"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data start *</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startDate} onChange={(e) => setStartDate(e.target.value)}
            required min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj (opțional)</label>
        <textarea
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Descrie nevoile seniorului, program preferat, orice detaliu relevant..."
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button" onClick={() => setOpen(false)}
          className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-white"
        >
          Anulează
        </button>
        <button
          type="submit" disabled={loading}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Se trimite...' : 'Trimite cererea'}
        </button>
      </div>
    </form>
  )
}
