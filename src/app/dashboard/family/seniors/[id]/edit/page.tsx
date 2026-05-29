import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import EditSeniorForm from '@/components/family/EditSeniorForm'

export default async function EditSeniorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'FAMILY') redirect('/login')

  const { id } = await params

  const family = await prisma.family.findUnique({ where: { userId: payload.sub } })
  if (!family) redirect('/login')

  const senior = await prisma.senior.findFirst({
    where: { id, familyId: family.id },
    include: {
      contracts: {
        where: { status: 'ACTIVE' },
        select: { id: true },
        take: 1,
      },
    },
  })
  if (!senior) notFound()

  const hasActiveContract = senior.contracts.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/dashboard/family"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            &#8592; Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-900 font-medium">Editează senior</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Editează profil senior</h1>
          <p className="text-sm text-gray-500 mt-1">{senior.nume}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <EditSeniorForm
            id={senior.id}
            initialNume={senior.nume}
            initialVarsta={senior.varsta}
            initialJudet={senior.judet}
            initialAdresa={senior.adresa}
            initialNevoi={senior.nevoi}
            initialConditii={senior.conditii ?? ''}
            initialLat={senior.lat ?? null}
            initialLng={senior.lng ?? null}
            hasActiveContract={hasActiveContract}
          />
        </div>
      </main>
    </div>
  )
}
