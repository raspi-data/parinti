import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailNewRequest } from '@/lib/email'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'FAMILY') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const family = await prisma.family.findUnique({ where: { userId: payload.sub } })
  if (!family) return NextResponse.json({ error: 'Profil familie negăsit' }, { status: 404 })

  const { caregiverId, seniorName, seniorAge, program, startDate, message } = await request.json()

  if (!caregiverId || !seniorName || !seniorAge || !program || !startDate) {
    return NextResponse.json({ error: 'Câmpuri obligatorii lipsă' }, { status: 400 })
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { id: caregiverId },
    include: { user: true },
  })
  if (!caregiver) return NextResponse.json({ error: 'Îngrijitor negăsit' }, { status: 404 })

  const existing = await prisma.contactRequest.findFirst({
    where: {
      familyId: family.id,
      caregiverId,
      status: 'PENDING',
    },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'Ai deja o cerere activă către acest îngrijitor' },
      { status: 409 },
    )
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const req = await prisma.contactRequest.create({
    data: {
      familyId: family.id,
      caregiverId,
      seniorName: seniorName.trim(),
      seniorAge: parseInt(seniorAge),
      program: program.trim(),
      startDate: new Date(startDate),
      message: message?.trim() || null,
      expiresAt,
    },
  })

  await emailNewRequest({
    caregiverEmail: caregiver.user.email,
    caregiverNume: caregiver.nume,
    familyEmail: payload.email,
    seniorName: req.seniorName,
    seniorAge: req.seniorAge,
    program: req.program,
    startDate: req.startDate,
    message: req.message,
    requestId: req.id,
  })

  return NextResponse.json(req, { status: 201 })
}
