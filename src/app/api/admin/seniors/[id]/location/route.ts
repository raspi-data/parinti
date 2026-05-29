import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { geocodeAddress } from '@/lib/geo'

// PUT — set explicit coords from admin map picker
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params
  const { lat, lng } = await request.json() as { lat: number; lng: number }

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat si lng sunt necesare' }, { status: 400 })
  }

  const senior = await prisma.senior.update({
    where: { id },
    data: { lat, lng },
  })

  return NextResponse.json(senior)
}

// DELETE — re-geocode from stored address
export async function DELETE(
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
  const senior = await prisma.senior.findUnique({ where: { id } })
  if (!senior) return NextResponse.json({ error: 'Senior negasit' }, { status: 404 })

  const coords = await geocodeAddress(senior.adresa, senior.judet)
  if (!coords) {
    return NextResponse.json({ error: 'Geocodare esuata — adresa nu a fost gasita' }, { status: 422 })
  }

  const updated = await prisma.senior.update({ where: { id }, data: coords })
  return NextResponse.json(updated)
}
