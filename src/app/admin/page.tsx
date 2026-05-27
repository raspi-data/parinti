import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LogoutButton from '@/components/LogoutButton'

export default async function AdminPanel() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'ADMIN') redirect('/login')

  const [pendingDocs, totalUsers, totalContracts] = await Promise.all([
    prisma.document.findMany({
      where: { status: 'PENDING' },
      include: { caregiver: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
    prisma.contract.count(),
  ])

  const docTypeLabel: Record<string, string> = {
    CI: 'Carte de identitate',
    CAZIER: 'Cazier judiciar',
    CERTIFICAT_ANC: 'Certificat ANC',
    CPR: 'CPR',
    ALTELE: 'Alte documente',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">parinti</span>
            <span className="text-xl font-bold text-gray-400">.care</span>
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{payload.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panou Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Verificare documente si monitorizare platforma</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total utilizatori" value={totalUsers} icon="👥" />
          <StatCard label="Total contracte" value={totalContracts} icon="📋" />
          <StatCard
            label="Documente in asteptare"
            value={pendingDocs.length}
            icon="📄"
            urgent={pendingDocs.length > 0}
          />
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documente in asteptare ({pendingDocs.length})
          </h2>

          {pendingDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <div className="text-3xl mb-3">✅</div>
              <p className="font-medium text-gray-700">Toate documentele sunt verificate</p>
              <p className="text-sm text-gray-400 mt-1">Nu exista documente in asteptare</p>
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
                          Incarcat {new Date(doc.createdAt).toLocaleDateString('ro-RO')}
                        </span>
                        {doc.expiresAt && (
                          <span className="text-xs text-amber-600">
                            Expira {new Date(doc.expiresAt).toLocaleDateString('ro-RO')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Vizualizeaza
                      </a>
                      <span className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg font-medium">
                        In asteptare
                      </span>
                    </div>
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
