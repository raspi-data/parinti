import { hash, compare } from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'parinti-care-jwt-secret-change-me')

export interface JWTPayload {
  sub: string
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed)
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ sub: payload.sub, email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}
