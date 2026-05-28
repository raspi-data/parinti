import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (payload) {
    if (payload.role === 'FAMILY') redirect('/dashboard/family')
    if (payload.role === 'CAREGIVER') redirect('/dashboard/caregiver')
    if (payload.role === 'ADMIN') redirect('/admin')
    redirect('/')
  }

  return <LoginForm />
}
