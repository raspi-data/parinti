import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'parinti-care-jwt-secret-change-me')

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, secret())
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set('token', '', { maxAge: 0, path: '/' })
    return response
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*', '/admin/:path*'],
}
