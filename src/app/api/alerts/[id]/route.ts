import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { id } = await params

  const alert = await prisma.alert.update({
    where: { id },
    data: { read: true },
  })

  return NextResponse.json(alert)
}
