'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarkAlertReadButton({ alertId }: { alertId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function mark() {
    setLoading(true)
    await fetch(`/api/alerts/${alertId}`, { method: 'PATCH' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={mark}
      disabled={loading}
      className="text-xs text-amber-600 underline hover:no-underline disabled:opacity-50 ml-auto shrink-0"
    >
      {loading ? '...' : 'Marchează citit'}
    </button>
  )
}
