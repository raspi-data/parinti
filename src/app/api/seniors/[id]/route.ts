import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { geocodeAddress } from '@/lib/geo'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'FAMILY') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params

  const family = await prisma.family.findUnique({ where: { userId: payload.sub } })
  if (!family) return NextResponse.json({ error: 'Familie negăsită' }, { status: 404 })

  const senior = await prisma.senior.findFirst({ where: { id, familyId: family.id } })
  if (!senior) return NextResponse.json({ error: 'Senior negăsit' }, { status: 404 })

  const body = await request.json() as {
    nume: string
    varsta: number
    judet: string
    adresa: string
    nevoi: string
    conditii?: string
    lat?: number | null
    lng?: number | null
  }

  const { nume, varsta, judet, adresa, nevoi, conditii, lat, lng } = body

  if (!adresa?.trim()) {
    return NextResponse.json({ error: 'Adresa este obligatorie' }, { status: 400 })
  }
  if (!judet?.trim()) {
    return NextResponse.json({ error: 'Județul este obligatoriu' }, { status: 400 })
  }
  const age = Number(varsta)
  if (!age || age < 50 || age > 120) {
    return NextResponse.json({ error: 'Vârsta trebuie să fie între 50 și 120 de ani' }, { status: 400 })
  }

  const addressChanged = senior.adresa !== adresa.trim() || senior.judet !== judet.trim()

  const updated = await prisma.senior.update({
    where: { id },
    data: {
      nume: nume?.trim() || senior.nume,
      varsta: age,
      judet: judet.trim(),
      adresa: adresa.trim(),
      nevoi: nevoi?.trim() || senior.nevoi,
      conditii: conditii?.trim() || null,
      // Keep explicit coords from body; clear them if address changed without new coords
      lat: lat != null ? lat : addressChanged ? null : senior.lat,
      lng: lng != null ? lng : addressChanged ? null : senior.lng,
    },
  })

  // Re-geocode in background if address changed and no explicit coords given
  if (addressChanged && lat == null) {
    geocodeAddress(adresa.trim(), judet.trim()).then((coords) => {
      if (coords) {
        prisma.senior.update({
          where: { id },
          data: { lat: coords.lat, lng: coords.lng },
        }).catch(() => {})
      }
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
