import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'FAMILY') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  await prisma.family.update({
    where: { userId: payload.sub },
    data: { acceptedToS: true, acceptedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
