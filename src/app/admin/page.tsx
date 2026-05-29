import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LogoutButton from '@/components/LogoutButton'
import RequestsSection, { type RequestRow, type Metrics } from './RequestsSection'
import SenioriSection, { type SeniorRow } from './SenioriSection'

export default async function AdminPanel() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'ADMIN') redirect('/login')

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart  = new Date(now.getTime() - 7  * 86_400_000)
  const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000)

  const [pendingDocs, totalUsers, totalContracts, allRequests, allSeniors] = await Promise.all([
    prisma.document.findMany({
      where: { status: 'PENDING' },
      include: { caregiver: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
    prisma.contract.count(),
    prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        family: { include: { user: true } },
        caregiver: true,
      },
    }),
    prisma.senior.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, nume: true, judet: true, adresa: true, varsta: true, lat: true, lng: true },
    }),
  ])

  // ── Metrics ─────────────────────────────────────────────────────────────
  const todayCount = allRequests.filter((r) => r.createdAt >= todayStart).length
  const weekCount  = allRequests.filter((r) => r.createdAt >= weekStart).length
  const monthCount = allRequests.filter((r) => r.createdAt >= monthStart).length

  const resolved = allRequests.filter((r) => r.status === 'ACCEPTED' || r.status === 'DECLINED' || r.status === 'EXPIRED')
  const accepted  = resolved.filter((r) => r.status === 'ACCEPTED').length
  const acceptanceRate = resolved.length > 0 ? (accepted / resolved.length) * 100 : 0

  const responseTimes = allRequests
    .filter((r) => r.status === 'ACCEPTED' || r.status === 'DECLINED')
    .map((r) => (r.updatedAt.getTime() - r.createdAt.getTime()) / 3_600_000)
  const avgResponseHours = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : null

  const metrics: Metrics = { todayCount, weekCount, monthCount, acceptanceRate, avgResponseHours }

  // ── Flags ────────────────────────────────────────────────────────────────
  // Caregiver with 3+ declines in last 7 days
  const recentDeclines = allRequests.filter(
    (r) => r.status === 'DECLINED' && r.updatedAt >= sevenDaysAgo,
  )
  const declineCount = new Map<string, number>()
  for (const r of recentDeclines) {
    declineCount.set(r.caregiverId, (declineCount.get(r.caregiverId) ?? 0) + 1)
  }
  const flaggedCaregiverIds = [...declineCount.entries()]
    .filter(([, c]) => c >= 3)
    .map(([id]) => id)

  // Family with 5+ requests and 0 contracts
  const reqByFamily = new Map<string, number>()
  for (const r of allRequests) {
    reqByFamily.set(r.familyId, (reqByFamily.get(r.familyId) ?? 0) + 1)
  }
  const heavyFamilyIds = [...reqByFamily.entries()].filter(([, c]) => c >= 5).map(([id]) => id)
  const familiesWithContracts = heavyFamilyIds.length
    ? await prisma.contract.findMany({
        where: { familyId: { in: heavyFamilyIds } },
        select: { familyId: true },
        distinct: ['familyId'],
      })
    : []
  const contractedFamilies = new Set(familiesWithContracts.map((f) => f.familyId))
  const flaggedFamilyIds = heavyFamilyIds.filter((id) => !contractedFamilies.has(id))

  // ── Serialise for client ──────────────────────────────────────────────────
  const rows: RequestRow[] = allRequests.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    status: r.status,
    seniorName: r.seniorName,
    seniorAge: r.seniorAge,
    program: r.program,
    startDate: r.startDate.toISOString(),
    message: r.message,
    family: {
      id: r.family.id,
      email: r.family.user.email,
      judet: r.family.judet,
    },
    caregiver: {
      id: r.caregiver.id,
      nume: r.caregiver.nume,
      judet: r.caregiver.judet,
      phone: r.caregiver.phone,
      tarif: r.caregiver.tarif,
      slug: r.caregiver.slug,
    },
  }))

  const docTypeLabel: Record<string, string> = {
    CI: 'Carte de identitate', CAZIER: 'Cazier judiciar',
    CERTIFICAT_ANC: 'Certificat ANC', CPR: 'CPR', ALTELE: 'Alte documente',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">parinti</span>
            <span className="text-xl font-bold text-gray-400">.care</span>
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{payload.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panou Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Monitorizare platformă și verificare documente</p>
        </div>

        {/* Platform overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total utilizatori" value={totalUsers} icon="👥" />
          <StatCard label="Total contracte" value={totalContracts} icon="📋" />
          <StatCard label="Documente în așteptare" value={pendingDocs.length} icon="📄" urgent={pendingDocs.length > 0} />
        </div>

        {/* Requests section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Cereri ({allRequests.length})
          </h2>
          <RequestsSection
            requests={rows}
            metrics={metrics}
            flaggedCaregiverIds={flaggedCaregiverIds}
            flaggedFamilyIds={flaggedFamilyIds}
          />
        </section>

        {/* Senior locations */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Locații seniori ({allSeniors.length})
            <span className="ml-2 text-sm font-normal text-gray-400">
              — {allSeniors.filter((s) => s.lat).length} geocodați
            </span>
          </h2>
          <SenioriSection seniors={allSeniors as SeniorRow[]} />
        </section>

        {/* Pending documents */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documente în așteptare ({pendingDocs.length})
          </h2>
          {pendingDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <div className="text-3xl mb-3">✅</div>
              <p className="font-medium text-gray-700">Toate documentele sunt verificate</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDocs.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{doc.caregiver.nume}</p>
                      <p className="text-sm text-gray-500">{doc.caregiver.user.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {docTypeLabel[doc.type] || doc.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          Încărcat {new Date(doc.createdAt).toLocaleDateString('ro-RO')}
                        </span>
                        {doc.expiresAt && (
                          <span className="text-xs text-amber-600">
                            Expiră {new Date(doc.expiresAt).toLocaleDateString('ro-RO')}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Vizualizează
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon, urgent }: { label: string; value: number; icon: string; urgent?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${urgent ? 'border-amber-300' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${urgent ? 'text-amber-600' : 'text-gray-900'}`}>{value}</span>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
