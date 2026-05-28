import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentType } from '@prisma/client'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'CAREGIVER') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const caregiver = await prisma.caregiver.findUnique({ where: { userId: payload.sub } })
  if (!caregiver) return NextResponse.json({ error: 'Profil negasit' }, { status: 404 })

  const { type, fileUrl, expiresAt } = await request.json()

  if (!type || !fileUrl) {
    return NextResponse.json({ error: 'Tip si URL document sunt obligatorii' }, { status: 400 })
  }

  const validTypes: DocumentType[] = ['CI', 'CAZIER', 'CERTIFICAT_ANC', 'CPR', 'ALTELE']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Tip document invalid' }, { status: 400 })
  }

  const doc = await prisma.document.create({
    data: {
      caregiverId: caregiver.id,
      type: type as DocumentType,
      fileUrl,
      status: 'PENDING',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return NextResponse.json(doc, { status: 201 })
}
