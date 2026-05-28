import { Suspense } from 'react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LogoutButton from '@/components/LogoutButton'
import SearchForm from './SearchForm'

interface PageProps {
  searchParams: Promise<{ judet?: string; maxTarif?: string; minExp?: string }>
}

export default async function CaregiversPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  const { judet, maxTarif, minExp } = await searchParams

  const where: Record<string, unknown> = { disponibil: true }
  if (judet) where.judet = judet
  if (maxTarif) where.tarif = { lte: parseFloat(maxTarif) }
  if (minExp) where.experienta = { gte: parseInt(minExp) }

  const caregivers = await prisma.caregiver.findMany({
    where,
    orderBy: [{ experienta: 'desc' }, { tarif: 'asc' }],
    include: {
      documents: { where: { status: 'VERIFIED' }, select: { type: true } },
    },
  })

  const dashboardHref =
    payload?.role === 'FAMILY'
      ? '/dashboard/family'
      : payload?.role === 'CAREGIVER'
        ? '/dashboard/caregiver'
        : payload?.role === 'ADMIN'
          ? '/admin'
          : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-blue-600">parinti</span>
            <span className="text-xl font-bold text-gray-400">.care</span>
          </Link>
          <div className="flex items-center gap-4">
            {payload ? (
              <>
                {dashboardHref && (
                  <Link href={dashboardHref} className="text-sm text-gray-600 hover:text-blue-600">
                    Dashboard
                  </Link>
                )}
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600">
                  Intră în cont
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Înregistrare
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingrijitori disponibili</h1>
          <p className="text-gray-500 text-sm mt-1">
            {caregivers.length} ingrijitor{caregivers.length !== 1 ? 'i' : ''} gasit
            {caregivers.length !== 1 ? 'i' : ''}
            {judet ? ` in ${judet}` : ''}
          </p>
        </div>

        <Suspense>
          <SearchForm />
        </Suspense>

        {caregivers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-medium text-gray-700">Niciun ingrijitor gasit</p>
            <p className="text-sm text-gray-400 mt-1">Incearca sa modifici filtrele</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caregivers.map((c) => {
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{c.nume}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {c.judet} &bull; {c.experienta} ani experienta
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-blue-600 text-lg">{c.tarif} RON</p>
                      <p className="text-xs text-gray-400">pe zi</p>
                    </div>
                  </div>

                  {c.bio && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{c.bio}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {c.documents.map((d) => (
                      <span
                        key={d.type}
                        className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full"
                      >
                        ✓ {d.type === 'CERTIFICAT_ANC' ? 'ANC' : d.type}
                      </span>
                    ))}
                  </div>

                  {payload?.role === 'FAMILY' ? (
                    <div className="pt-1 border-t border-gray-100 mt-auto">
                      <p className="text-xs text-gray-400 mb-1">Contact direct</p>
                      <p className="text-sm font-medium text-gray-800">{c.phone}</p>
                    </div>
                  ) : (
                    <div className="pt-1 border-t border-gray-100 mt-auto">
                      <Link
                        href="/register"
                        className="block text-center text-sm bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 font-medium"
                      >
                        Inregistreaza-te pentru a contacta
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
