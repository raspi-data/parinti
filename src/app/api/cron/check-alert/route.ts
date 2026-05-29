import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailMissedCheckin } from '@/lib/email'

// Called by cron at 10:00 every day
// Alerts family if no IN check-in by 10 AM
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const activeContracts = await prisma.contract.findMany({
    where: { status: 'ACTIVE' },
    include: {
      family: { include: { user: true } },
      caregiver: true,
      senior: true,
      checkins: {
        where: { type: 'IN', createdAt: { gte: todayStart } },
        take: 1,
      },
      alerts: {
        where: { type: 'CHECKIN_LATE', createdAt: { gte: todayStart } },
        take: 1,
      },
    },
  })

  let alerted = 0

  for (const contract of activeContracts) {
    const hasCheckinToday = contract.checkins.length > 0
    const alreadyAlerted = contract.alerts.length > 0

    if (hasCheckinToday || alreadyAlerted) continue

    await prisma.alert.create({
      data: {
        contractId: contract.id,
        type: 'CHECKIN_LATE',
        message: `Îngrijitorul ${contract.caregiver.nume} nu a efectuat check-in astăzi pentru ${contract.senior.nume}.`,
      },
    })

    await emailMissedCheckin({
      familyEmail: contract.family.user.email,
      caregiverNume: contract.caregiver.nume,
      seniorNume: contract.senior.nume,
      contractId: contract.id,
    })

    alerted++
  }

  return NextResponse.json({ checked: activeContracts.length, alerted })
}
