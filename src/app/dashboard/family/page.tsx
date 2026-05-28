import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import FamilyActions from '@/components/family/FamilyActions'
import MarkAlertReadButton from '@/components/family/MarkAlertReadButton'

const REQ_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'În așteptare', cls: 'bg-amber-100 text-amber-700' },
  ACCEPTED: { label: 'Acceptat',     cls: 'bg-emerald-100 text-emerald-700' },
  DECLINED: { label: 'Refuzat',      cls: 'bg-red-100 text-red-700' },
  EXPIRED:  { label: 'Expirat',      cls: 'bg-gray-100 text-gray-500' },
}

export default async function FamilyDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'FAMILY') redirect('/login')

  const family = await prisma.family.findUnique({
    where: { userId: payload.sub },
    include: {
      seniors: true,
      contracts: {
        where: { status: 'ACTIVE' },
        include: {
          caregiver: true,
          senior: true,
          alerts: { where: { read: false }, orderBy: { createdAt: 'desc' }, take: 5 },
          checkins: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      },
      requests: {
        include: { caregiver: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  const unreadAlerts = family?.contracts.flatMap((c) => c.alerts) ?? []
  const requests = family?.requests ?? []
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">parinti</span>
            <span className="text-xl font-bold text-gray-400">.care</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/ingrijitori" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Caută Îngrijitor
            </Link>
            <span className="text-sm text-gray-500 hidden sm:block">{payload.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Familie</h1>
          <p className="text-gray-500 text-sm mt-1">Bine ai venit, {payload.email}</p>
        </div>

        {unreadAlerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h2 className="font-semibold text-amber-800 mb-3">Alerte ({unreadAlerts.length})</h2>
            <div className="space-y-2">
              {unreadAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="mt-0.5">&#9888;</span>
                  <span className="flex-1">{alert.message}</span>
                  <MarkAlertReadButton alertId={alert.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Seniori înregistrați" value={family?.seniors.length ?? 0} icon="👴" />
          <StatCard label="Contracte active" value={family?.contracts.length ?? 0} icon="📋" />
          <StatCard label="Cereri active" value={pendingCount} icon="📨" urgent={pendingCount > 0} />
        </div>

        {requests.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cererile mele</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {requests.map((req) => {
                const st = REQ_STATUS[req.status] ?? REQ_STATUS.EXPIRED
                const isAccepted = req.status === 'ACCEPTED'
                return (
                  <div key={req.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-medium text-gray-900">{req.caregiver.nume}</p>
                        <p className="text-sm text-gray-500">
                          {req.caregiver.judet} &bull; Senior: {req.seniorName}, {req.seniorAge} ani
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Program: {req.program} &bull; Start: {new Date(req.startDate).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>

                    {isAccepted && (
                      <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                        <p className="text-xs font-medium text-emerald-700 mb-1">Contact îngrijitor (contract activ)</p>
                        <p className="text-lg font-bold text-emerald-800">{req.caregiver.phone}</p>
                      </div>
                    )}

                    {req.status === 'PENDING' && (
                      <p className="text-xs text-amber-600 mt-2">
                        Expiră: {new Date(req.expiresAt).toLocaleString('ro-RO')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contracte active</h2>
          {!family?.contracts.length ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className="font-medium text-gray-700">Niciun contract activ</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Caută un îngrijitor disponibil în zona ta.</p>
              <Link href="/ingrijitori" className="inline-block bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700">
                Caută Îngrijitor
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {family.contracts.map((contract) => (
                <div key={contract.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{contract.caregiver.nume}</p>
                      <p className="text-sm text-gray-500">
                        Senior: {contract.senior.nume} &bull; {contract.tarif} RON/zi
                      </p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">Activ</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Județ: {contract.caregiver.judet} &bull; Program: {contract.program}
                    {contract.checkins[0] && (
                      <span> &bull; Ultim check-in: {new Date(contract.checkins[0].createdAt).toLocaleDateString('ro-RO')}</span>
                    )}
                  </div>
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                    <p className="text-xs text-emerald-600 mb-0.5">Contact direct</p>
                    <p className="font-bold text-emerald-800">{contract.caregiver.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Seniori</h2>
            <FamilyActions />
          </div>
          {!family?.seniors.length ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <div className="text-3xl mb-3">👴</div>
              <p className="font-medium text-gray-700">Niciun senior adăugat</p>
              <p className="text-sm text-gray-400 mt-1">Adaugă profilul seniorului pentru a căuta îngrijitori.</p>
              <div className="mt-4"><FamilyActions /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {family.seniors.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="font-medium text-gray-900">{s.nume}</p>
                  <p className="text-sm text-gray-500">{s.varsta} ani &bull; {s.judet}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.nevoi}</p>
                  {s.conditii && <p className="text-xs text-gray-400 mt-0.5">Condiții: {s.conditii}</p>}
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
