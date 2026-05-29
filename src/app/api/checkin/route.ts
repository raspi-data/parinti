import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { haversineDistanceM } from '@/lib/geo'

const GEOFENCE_RADIUS_M = 300

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { contractId, type, lat, lng } = await request.json() as {
    contractId: string
    type: string
    lat?: number
    lng?: number
  }

  if (!contractId || !['IN', 'OUT'].includes(type)) {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, caregiver: { userId: payload.sub } },
    include: { senior: true },
  })
  if (!contract) return NextResponse.json({ error: 'Contract negasit' }, { status: 404 })

  // Geofencing — only if we have both caregiver position and senior coordinates
  let distanceM: number | null = null
  if (lat != null && lng != null && contract.senior.lat && contract.senior.lng) {
    distanceM = Math.round(haversineDistanceM(lat, lng, contract.senior.lat, contract.senior.lng))
    if (distanceM > GEOFENCE_RADIUS_M) {
      return NextResponse.json(
        {
          error: `Ești la ${distanceM} m de adresă, necesari maxim ${GEOFENCE_RADIUS_M} m.`,
          distanceM,
          geofenceError: true,
        },
        { status: 422 },
      )
    }
  }

  const checkin = await prisma.checkin.create({
    data: { contractId, type, lat: lat ?? null, lng: lng ?? null },
  })

  return NextResponse.json({ ...checkin, distanceM }, { status: 201 })
}
