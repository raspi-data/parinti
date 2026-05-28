import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailRequestDeclined } from '@/lib/email'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'CAREGIVER') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params

  const caregiver = await prisma.caregiver.findUnique({ where: { userId: payload.sub } })
  if (!caregiver) return NextResponse.json({ error: 'Profil negăsit' }, { status: 404 })

  const contactReq = await prisma.contactRequest.findFirst({
    where: { id, caregiverId: caregiver.id, status: 'PENDING' },
    include: { family: { include: { user: true } } },
  })
  if (!contactReq) return NextResponse.json({ error: 'Cerere negăsită' }, { status: 404 })

  await prisma.contactRequest.update({ where: { id }, data: { status: 'DECLINED' } })

  const alternatives = await prisma.caregiver.findMany({
    where: {
      judet: caregiver.judet,
      disponibil: true,
      id: { not: caregiver.id },
    },
    select: { nume: true, judet: true, tarif: true, slug: true },
    take: 3,
  })

  await emailRequestDeclined({
    familyEmail: contactReq.family.user.email,
    caregiverNume: caregiver.nume,
    alternatives,
  })

  return NextResponse.json({ success: true })
}
