'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Role = 'FAMILY' | 'CAREGIVER'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('FAMILY')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Parola trebuie sa aiba cel putin 8 caractere')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Inregistrare esuata')
      setLoading(false)
      return
    }

    if (data.role === 'FAMILY') router.push('/dashboard/family')
    else if (data.role === 'CAREGIVER') router.push('/dashboard/caregiver')
    else router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="text-2xl font-bold text-blue-600">parinti</span>
            <span className="text-2xl font-bold text-gray-400">.care</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Creeaza cont</h1>
          <p className="text-gray-500 text-sm mb-6">Incepe gratuit astazi</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sunt...</label>
              <div className="grid grid-cols-2 gap-3">
                {(['FAMILY', 'CAREGIVER'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      role === r
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {r === 'FAMILY' ? '👨‍👩‍👧 Familie' : '🤝 Ingrijitor'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="adresa@email.ro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parola</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minim 8 caractere"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Se creeaza contul...' : 'Creeaza cont'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Prin inregistrare esti de acord cu Termenii si Conditiile
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Ai deja cont?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Intra in cont
          </Link>
        </p>
      </div>
    </div>
  )
}
