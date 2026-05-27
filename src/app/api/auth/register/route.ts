import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  const { email, password, role } = await request.json()

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Câmpuri lipsă' }, { status: 400 })
  }

  if (!['FAMILY', 'CAREGIVER'].includes(role)) {
    return NextResponse.json({ error: 'Rol invalid' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email deja înregistrat' }, { status: 409 })
  }

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, password: hashed, role: role as Role },
  })

  if (role === 'FAMILY') {
    await prisma.family.create({
      data: { userId: user.id, judet: 'Nespecificat', plan: 'basic' },
    })
  } else if (role === 'CAREGIVER') {
    await prisma.caregiver.create({
      data: {
        userId: user.id,
        nume: email.split('@')[0],
        phone: '0700000000',
        judet: 'Nespecificat',
        experienta: 0,
        tarif: 0,
      },
    })
  }

  const token = await generateToken({ sub: user.id, email: user.email, role: user.role })

  const response = NextResponse.json({ success: true, role: user.role }, { status: 201 })
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}
