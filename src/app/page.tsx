import { cookies } from 'next/headers'
import Link from 'next/link'
import { verifyToken } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  const dashboardHref =
    payload?.role === 'FAMILY'
      ? '/dashboard/family'
      : payload?.role === 'CAREGIVER'
        ? '/dashboard/caregiver'
        : payload?.role === 'ADMIN'
          ? '/admin'
          : '/login'

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">parinti</span>
          <span className="text-2xl font-bold text-gray-400">.care</span>
        </div>
        <div className="flex items-center gap-3">
          {payload ? (
            <>
              <span className="text-sm text-gray-400 hidden sm:block">{payload.email}</span>
              <Link
                href={dashboardHref}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Intră în cont
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Înregistrare
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          Ingrijire profesionala la domiciliu
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Ingrijire de calitate<br />
          <span className="text-blue-600">pentru parintii tai</span>
        </h1>

        <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
          Conectam familiile cu ingrijitori verificati si calificati. Monitorizare in timp real,
          jurnal zilnic si plati securizate &mdash; totul intr-o singura platforma.
        </p>

        <div className="flex gap-4 justify-center mb-20 flex-wrap">
          <Link
            href={payload?.role === 'FAMILY' ? '/dashboard/family' : payload ? dashboardHref : '/register'}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            {payload ? 'Mergi la Dashboard' : 'Cauta un ingrijitor'}
          </Link>
          {!payload && (
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              Sunt ingrijitor
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            {
              icon: '✓',
              title: 'Ingrijitori verificati',
              desc: 'Fiecare ingrijitor trece printr-un proces riguros de verificare a documentelor si referintelor.',
            },
            {
              icon: '📍',
              title: 'Check-in cu locatie',
              desc: 'Urmaresti in timp real cand ingrijitorul ajunge si pleaca, cu confirmare GPS.',
            },
            {
              icon: '📝',
              title: 'Jurnal zilnic',
              desc: 'Ingrijitorul completeaza un jurnal zilnic analizat cu AI pentru a detecta orice schimbare.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        &copy; 2026 parinti.care &mdash; Ingrijire la domiciliu
      </footer>
    </div>
  )
}
