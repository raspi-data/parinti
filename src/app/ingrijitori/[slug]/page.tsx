import { cache } from 'react'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LogoutButton from '@/components/LogoutButton'
import SolicitaForm from './SolicitaForm'

const DOC_BADGE: Record<string, string> = {
  CI: 'CI verificat',
  CAZIER: 'Cazier judiciar verificat',
  CERTIFICAT_ANC: 'Certificat ANC',
  CPR: 'Certificat CPR / Prim ajutor',
  ALTELE: 'Document verificat',
}

const getCaregiver = cache(async (slug: string) => {
  return prisma.caregiver.findUnique({
    where: { slug },
    include: {
      documents: { where: { status: 'VERIFIED' }, select: { type: true } },
      contracts: {
        include: { reviews: { select: { rating: true, text: true, createdAt: true } } },
      },
    },
  })
})

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const c = await getCaregiver(slug)
  if (!c) return { title: 'Îngrijitor | Parinti.care' }
  return {
    title: `Îngrijitor ${c.nume} - ${c.judet} | Parinti.care`,
    description: c.bio
      ? c.bio.slice(0, 150)
      : `Îngrijitor profesionist în ${c.judet} cu ${c.experienta} ani experiență. Tarif ${c.tarif} RON/zi.`,
  }
}

export default async function CaregiverProfilePage({ params }: PageProps) {
  const { slug } = await params
  const caregiver = await getCaregiver(slug)
  if (!caregiver) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  const dashboardHref =
    payload?.role === 'FAMILY' ? '/dashboard/family'
    : payload?.role === 'CAREGIVER' ? '/dashboard/caregiver'
    : payload?.role === 'ADMIN' ? '/admin'
    : null

  let showPhone = false
  let familySeniors: Array<{ id: string; nume: string; varsta: number }> = []
  let hasPendingRequest = false

  if (payload?.role === 'FAMILY') {
    const family = await prisma.family.findUnique({
      where: { userId: payload.sub },
      include: {
        seniors: { select: { id: true, nume: true, varsta: true } },
        contracts: {
          where: { caregiverId: caregiver.id, status: 'ACTIVE' },
          take: 1,
        },
        requests: {
          where: { caregiverId: caregiver.id, status: 'PENDING' },
          take: 1,
        },
      },
    })
    if (family) {
      showPhone = family.contracts.length > 0
      familySeniors = family.seniors
      hasPendingRequest = family.requests.length > 0
    }
  }

  const allReviews = caregiver.contracts.flatMap((c) => c.reviews)
  const avgRating =
    allReviews.length > 0
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600">Intră în cont</Link>
                <Link href="/register" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Înregistrare
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-4">
          <Link href="/ingrijitori" className="text-sm text-blue-600 hover:underline">
            ← Înapoi la listă
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-10 text-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold">{caregiver.nume}</h1>
                <p className="text-blue-100 mt-1">
                  {caregiver.judet} &bull; {caregiver.experienta} ani experiență
                </p>
                {avgRating && (
                  <p className="text-blue-100 mt-1">
                    ★ {avgRating.toFixed(1)} ({allReviews.length} recenzii)
                  </p>
                )}
              </div>
              <div className="bg-white/20 rounded-xl px-5 py-3 text-center">
                <p className="text-3xl font-bold">{caregiver.tarif}</p>
                <p className="text-blue-100 text-sm">RON / zi</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {caregiver.bio && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Despre mine</h2>
                <p className="text-gray-700 leading-relaxed">{caregiver.bio}</p>
              </section>
            )}

            {caregiver.documents.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Documente verificate</h2>
                <div className="flex flex-wrap gap-2">
                  {caregiver.documents.map((d) => (
                    <span key={d.type} className="flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
                      <span className="text-emerald-500">✓</span>
                      {DOC_BADGE[d.type] ?? d.type}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {allReviews.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Recenzii ({allReviews.length})
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-bold text-gray-900">{avgRating?.toFixed(1)}</span>
                  <div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={avgRating && avgRating >= star ? 'text-amber-400' : 'text-gray-200'}>★</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{allReviews.length} recenzii</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {allReviews.slice(0, 3).map((r, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('ro-RO')}</span>
                      </div>
                      {r.text && <p className="text-sm text-gray-600">{r.text}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="pt-4 border-t border-gray-100">
              {showPhone ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <p className="text-sm font-medium text-emerald-800 mb-1">Contact direct (contract activ)</p>
                  <p className="text-2xl font-bold text-emerald-700">{caregiver.phone}</p>
                </div>
              ) : hasPendingRequest ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                  <p className="font-medium text-blue-800">Cerere trimisă — în așteptarea răspunsului</p>
                  <p className="text-sm text-blue-600 mt-1">Vei primi un email imediat ce îngrijitorul răspunde.</p>
                </div>
              ) : payload?.role === 'FAMILY' ? (
                <div className="space-y-3">
                  <SolicitaForm
                    caregiverId={caregiver.id}
                    caregiverNume={caregiver.nume}
                    seniors={familySeniors}
                  />
                  <p className="text-xs text-center text-gray-400">
                    Numărul de telefon devine vizibil după semnarea contractului.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/register"
                    className="block w-full text-center bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700"
                  >
                    Solicită îngrijitor
                  </Link>
                  <p className="text-xs text-center text-gray-400">
                    Ai deja cont?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline">Intră în cont</Link>
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
