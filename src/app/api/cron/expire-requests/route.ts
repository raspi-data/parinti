import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailRequestExpired } from '@/lib/email'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expired = await prisma.contactRequest.findMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    include: {
      family: { include: { user: true } },
      caregiver: true,
    },
  })

  await prisma.contactRequest.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  })

  for (const req of expired) {
    await emailRequestExpired({
      familyEmail: req.family.user.email,
      caregiverNume: req.caregiver.nume,
    })
  }

  return NextResponse.json({ expired: expired.length })
}
