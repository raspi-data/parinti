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

  const { contractId, distanceM } = await request.json() as {
    contractId: string
    distanceM: number
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, caregiver: { userId: payload.sub } },
    include: { caregiver: true, senior: true },
  })
  if (!contract) return NextResponse.json({ error: 'Contract negasit' }, { status: 404 })

  await prisma.alert.create({
    data: {
      contractId,
      type: 'SOS',
      message: `Îngrijitorul ${contract.caregiver.nume} raportează o problemă de locație la check-in pentru ${contract.senior.nume}. Distanță GPS detectată: ${distanceM} m (limita: 300 m). Verificați dacă coordonatele adresei sunt corecte.`,
    },
  })

  return NextResponse.json({ success: true })
}
