import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LogoutButton from '@/components/LogoutButton'
import FamilyActions from '@/components/family/FamilyActions'
import MarkAlertReadButton from '@/components/family/MarkAlertReadButton'

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
    },
  })

  const unreadAlerts = family?.contracts.flatMap((c) => c.alerts) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">parinti</span>
            <span className="text-xl font-bold text-gray-400">.care</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{payload.email}</span>
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
            <h2 className="font-semibold text-amber-800 mb-3">
              Alerte ({unreadAlerts.length})
            </h2>
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
          <StatCard label="Seniori inregistrati" value={family?.seniors.length ?? 0} icon="👴" />
          <StatCard
            label="Contracte active"
            value={family?.contracts.filter((c) => c.status === 'ACTIVE').length ?? 0}
            icon="📋"
          />
          <StatCard label="Alerte necitite" value={unreadAlerts.length} icon="🔔" urgent={unreadAlerts.length > 0} />
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contracte active</h2>
          {!family?.contracts.length ? (
            <EmptyState
              icon="📋"
              title="Niciun contract activ"
              desc="Cauta un ingrijitor disponibil in zona ta."
            />
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
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                      Activ
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Judet: {contract.caregiver.judet} &bull; Program: {contract.program}
                    {contract.checkins[0] && (
                      <span>
                        {' '}&bull; Ultim check-in:{' '}
                        {new Date(contract.checkins[0].createdAt).toLocaleDateString('ro-RO')}
                      </span>
                    )}
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
              <p className="font-medium text-gray-700">Niciun senior adaugat</p>
              <p className="text-sm text-gray-400 mt-1">
                Adauga profilul seniorului pentru a cauta ingrijitori.
              </p>
              <div className="mt-4">
                <FamilyActions />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {family.seniors.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="font-medium text-gray-900">{s.nume}</p>
                  <p className="text-sm text-gray-500">{s.varsta} ani &bull; {s.judet}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.nevoi}</p>
                  {s.conditii && (
                    <p className="text-xs text-gray-400 mt-0.5">Conditii: {s.conditii}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function StatCard({
  label, value, icon, urgent,
}: {
  label: string
  value: number
  icon: string
  urgent?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${urgent ? 'border-amber-300' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${urgent ? 'text-amber-600' : 'text-gray-900'}`}>
          {value}
        </span>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="font-medium text-gray-700">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
  )
}
