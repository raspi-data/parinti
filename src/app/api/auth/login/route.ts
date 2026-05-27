import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Câmpuri lipsă' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Date incorecte' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Date incorecte' }, { status: 401 })
  }

  const token = await generateToken({ sub: user.id, email: user.email, role: user.role })

  const response = NextResponse.json({ success: true, role: user.role })
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}
