import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'CAREGIVER') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { nume, phone, judet, bio, tarif, experienta, disponibil } = await request.json()

  if (!nume || !phone || !judet || tarif === undefined || experienta === undefined) {
    return NextResponse.json({ error: 'Completati toate campurile obligatorii' }, { status: 400 })
  }

  const caregiver = await prisma.caregiver.update({
    where: { userId: payload.sub },
    data: {
      nume,
      phone,
      judet,
      bio: bio || null,
      tarif: parseFloat(tarif),
      experienta: parseInt(experienta),
      disponibil: Boolean(disponibil),
    },
  })

  return NextResponse.json(caregiver)
}
