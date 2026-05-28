'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CountdownTimer from '@/components/CountdownTimer'

interface Props {
  id: string
  seniorName: string
  seniorAge: number
  program: string
  startDate: string
  message: string | null
  familyEmail: string
  expiresAt: string
}

export default function RequestCard({
  id, seniorName, seniorAge, program, startDate, message, familyEmail, expiresAt,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null)
  const [error, setError] = useState('')

  async function act(action: 'accept' | 'decline') {
    setLoading(action)
    setError('')
    const res = await fetch(`/api/requests/${id}/${action}`, { method: 'POST' })
    setLoading(null)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Eroare')
      return
    }
    setDone(action === 'accept' ? 'accepted' : 'declined')
    router.refresh()
  }

  if (done === 'accepted') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <p className="font-medium text-emerald-800">Cerere acceptată — contractul a fost generat!</p>
        <p className="text-sm text-emerald-600 mt-1">Familie: {familyEmail} &bull; Senior: {seniorName}</p>
      </div>
    )
  }

  if (done === 'declined') {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-xl p-5">
        <p className="text-sm text-gray-500">Cerere refuzată — familia a fost notificată.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-semibold text-gray-900">{seniorName}, {seniorAge} ani</p>
          <p className="text-sm text-gray-500 mt-0.5">Familie: {familyEmail}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
          Expiră în <CountdownTimer expiresAt={expiresAt} />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Program dorit</p>
          <p className="font-medium text-gray-800">{program}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Data start</p>
          <p className="font-medium text-gray-800">
            {new Date(startDate).toLocaleDateString('ro-RO')}
          </p>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
          <p className="text-xs text-blue-500 mb-1 font-medium">Mesaj</p>
          {message}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => act('decline')}
          disabled={!!loading}
          className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading === 'decline' ? 'Se refuză...' : 'Refuză'}
        </button>
        <button
          onClick={() => act('accept')}
          disabled={!!loading}
          className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === 'accept' ? 'Se acceptă...' : 'Acceptă'}
        </button>
      </div>
    </div>
  )
}
