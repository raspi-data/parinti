import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailRequestAccepted, emailCaregiverContractCreated } from '@/lib/email'

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

  if (contactReq.expiresAt < new Date()) {
    await prisma.contactRequest.update({ where: { id }, data: { status: 'EXPIRED' } })
    return NextResponse.json({ error: 'Cererea a expirat' }, { status: 410 })
  }

  let senior = await prisma.senior.findFirst({
    where: {
      familyId: contactReq.familyId,
      nume: { equals: contactReq.seniorName, mode: 'insensitive' },
    },
  })

  if (!senior) {
    senior = await prisma.senior.create({
      data: {
        familyId: contactReq.familyId,
        nume: contactReq.seniorName,
        varsta: contactReq.seniorAge,
        judet: caregiver.judet,
        adresa: '-',
        nevoi: contactReq.message ?? 'Îngrijire la domiciliu',
      },
    })
  }

  const contract = await prisma.contract.create({
    data: {
      familyId: contactReq.familyId,
      caregiverId: caregiver.id,
      seniorId: senior.id,
      tarif: caregiver.tarif,
      program: contactReq.program,
      startDate: contactReq.startDate,
      status: 'ACTIVE',
    },
  })

  await prisma.contactRequest.update({
    where: { id },
    data: { status: 'ACCEPTED', contractId: contract.id },
  })

  await emailRequestAccepted({
    familyEmail: contactReq.family.user.email,
    caregiverNume: caregiver.nume,
    caregiverPhone: caregiver.phone,
    seniorName: contactReq.seniorName,
    program: contactReq.program,
    startDate: contactReq.startDate,
  })

  await emailCaregiverContractCreated({
    caregiverEmail: payload.email,
    familyEmail: contactReq.family.user.email,
    seniorName: contactReq.seniorName,
    program: contactReq.program,
  })

  return NextResponse.json({ contractId: contract.id })
}
