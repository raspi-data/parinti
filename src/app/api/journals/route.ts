import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'CAREGIVER') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { contractId, text } = await request.json()

  if (!contractId || !text?.trim()) {
    return NextResponse.json({ error: 'Contractul si textul sunt obligatorii' }, { status: 400 })
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, caregiver: { userId: payload.sub } },
  })
  if (!contract) return NextResponse.json({ error: 'Contract negasit' }, { status: 404 })

  const journal = await prisma.journal.create({
    data: { contractId, text: text.trim() },
  })

  return NextResponse.json(journal, { status: 201 })
}
