'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckinButton({ contractId }: { contractId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleCheckin(type: 'IN' | 'OUT') {
    setLoading(true)
    await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId, type }),
    })
    setDone(true)
    setLoading(false)
    router.refresh()
  }

  if (done) {
    return (
      <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium">
        Check-in inregistrat
      </span>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleCheckin('IN')}
        disabled={loading}
        className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
      >
        Sosire
      </button>
      <button
        onClick={() => handleCheckin('OUT')}
        disabled={loading}
        className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors font-medium"
      >
        Plecare
      </button>
    </div>
  )
}
