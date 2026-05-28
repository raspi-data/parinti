import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailNewRequest } from '@/lib/email'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params

  const req = await prisma.contactRequest.findUnique({
    where: { id },
    include: {
      caregiver: { include: { user: true } },
      family: { include: { user: true } },
    },
  })

  if (!req || req.status !== 'PENDING') {
    return NextResponse.json({ error: 'Cerere negăsită sau nu este PENDING' }, { status: 404 })
  }

  await emailNewRequest({
    caregiverEmail: req.caregiver.user.email,
    caregiverNume: req.caregiver.nume,
    familyEmail: req.family.user.email,
    seniorName: req.seniorName,
    seniorAge: req.seniorAge,
    program: req.program,
    startDate: req.startDate,
    message: req.message,
    requestId: req.id,
  })

  return NextResponse.json({ success: true })
}
