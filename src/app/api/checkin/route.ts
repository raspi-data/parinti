import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { contractId, type } = await request.json()
  if (!contractId || !['IN', 'OUT'].includes(type)) {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, caregiver: { userId: payload.sub } },
  })
  if (!contract) return NextResponse.json({ error: 'Contract negasit' }, { status: 404 })

  const checkin = await prisma.checkin.create({
    data: { contractId, type },
  })

  return NextResponse.json(checkin, { status: 201 })
}
