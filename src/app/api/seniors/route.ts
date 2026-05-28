import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'FAMILY') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const family = await prisma.family.findUnique({ where: { userId: payload.sub } })
  if (!family) return NextResponse.json({ error: 'Profil familie negasit' }, { status: 404 })

  const { nume, varsta, judet, adresa, nevoi, conditii } = await request.json()

  if (!nume || !varsta || !judet || !adresa || !nevoi) {
    return NextResponse.json({ error: 'Completati toate campurile obligatorii' }, { status: 400 })
  }

  const senior = await prisma.senior.create({
    data: {
      familyId: family.id,
      nume,
      varsta: parseInt(varsta),
      judet,
      adresa,
      nevoi,
      conditii: conditii || null,
    },
  })

  return NextResponse.json(senior, { status: 201 })
}
