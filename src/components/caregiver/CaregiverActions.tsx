'use client'

import { useState } from 'react'
import EditProfileModal from './EditProfileModal'
import AddDocumentModal from './AddDocumentModal'

interface ProfileData {
  nume: string
  phone: string
  judet: string
  bio: string
  tarif: number
  experienta: number
  disponibil: boolean
}

export default function CaregiverActions({ profile }: { profile: ProfileData }) {
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddDoc, setShowAddDoc] = useState(false)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowEditProfile(true)}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Editeaza Profilul
        </button>
        <button
          onClick={() => setShowAddDoc(true)}
          className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Adauga Document
        </button>
      </div>

      {showEditProfile && (
        <EditProfileModal initial={profile} onClose={() => setShowEditProfile(false)} />
      )}
      {showAddDoc && <AddDocumentModal onClose={() => setShowAddDoc(false)} />}
    </>
  )
}
