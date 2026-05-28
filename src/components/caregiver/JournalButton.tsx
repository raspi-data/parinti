'use client'

import { useState } from 'react'
import AddJournalModal from './AddJournalModal'

interface Props {
  contractId: string
  seniorNume: string
}

export default function JournalButton({ contractId, seniorNume }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs border border-blue-200 text-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-50 font-medium"
      >
        + Nota jurnal
      </button>
      {open && (
        <AddJournalModal
          contractId={contractId}
          seniorNume={seniorNume}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
