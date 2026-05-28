'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  isLoggedInFamily: boolean
  caregiverNume: string
}

export default function SolicitaButton({ isLoggedInFamily, caregiverNume }: Props) {
  const [sent, setSent] = useState(false)

  if (!isLoggedInFamily) {
    return (
      <Link
        href="/register"
        className="block w-full text-center bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors"
      >
        Solicită îngrijitor
      </Link>
    )
  }

  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
        <p className="text-emerald-700 font-medium text-sm">Cerere înregistrată!</p>
        <p className="text-emerald-600 text-xs mt-1">
          Te vom contacta în maxim 24h pentru a stabili detaliile contractului.
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={() => setSent(true)}
      className="block w-full text-center bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors"
    >
      Solicită îngrijitor
    </button>
  )
}
