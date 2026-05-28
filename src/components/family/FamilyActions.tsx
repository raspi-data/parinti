'use client'

import { useState } from 'react'
import AddSeniorModal from './AddSeniorModal'

export default function FamilyActions() {
  const [showAddSenior, setShowAddSenior] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowAddSenior(true)}
        className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
      >
        <span className="text-base leading-none">+</span>
        Adauga Senior
      </button>

      {showAddSenior && <AddSeniorModal onClose={() => setShowAddSenior(false)} />}
    </>
  )
}
