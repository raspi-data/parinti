import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LogoutButton from '@/components/LogoutButton'
import CheckinButton from '@/components/CheckinButton'
import CaregiverActions from '@/components/caregiver/CaregiverActions'
import JournalButton from '@/components/caregiver/JournalButton'
import RequestCard from '@/components/caregiver/RequestCard'

const DOC_LABELS: Record<string, string> = {
  CI: 'Carte de identitate', CAZIER: 'Cazier judiciar',
  CERTIFICAT_ANC: 'Certificat ANC', CPR: 'Certificat CPR', ALTELE: 'Alt document',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', VERIFIED: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-orange-100 text-orange-700', REJECTED: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'În verificare', VERIFIED: 'Verificat', EXPIRED: 'Expirat', REJECTED: 'Respins',
}

export default async function CaregiverDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'CAREGIVER') redirect('/login')

  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: payload.sub },
    include: {
      documents: { orderBy: { createdAt: 'desc' } },
      contracts: {
        where: { status: 'ACTIVE' },
        include: {
          family: { include: { user: true } },
          senior: true,
          checkins: { orderBy: { createdAt: 'desc' }, take: 3 },
          journals: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: { createdAt: 'desc' },
      },
      requests: {
        where: { status: 'PENDING', expiresAt: { gt: new Date() } },
        include: { family: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const totalContracts = caregiver?.contracts.length ?? 0
  const pendingRequests = caregiver?.requests ?? []
  const todayCheckins = caregiver?.contracts.flatMap((c) =>
    c.checkins.filter((ch) => new Date(ch.createdAt).toDateString() === new Date().toDateString())
  ) ?? []

  const profileData = {
    nume: caregiver?.nume || '', phone: caregiver?.phone || '',
    judet: caregiver?.judet || '', bio: caregiver?.bio || '',
    tarif: caregiver?.tarif ?? 0, experienta: caregiver?.experienta ?? 0,
    disponibil: caregiver?.disponibil ?? true,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">parinti</span>
            <span className="text-xl font-bold text-gray-400">.care</span>
          </div>
          <div className="flex items-center gap-4">
            {pendingRequests.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                {pendingRequests.length} cerere{pendingRequests.length !== 1 ? 'i' : ''} nouă
              </span>
            )}
            <span className="text-sm text-gray-500">{caregiver?.nume || payload.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Îngrijitor</h1>
            <p className="text-gray-500 text-sm mt-1">
              {caregiver?.disponibil
                ? <span className="text-emerald-600 font-medium">Disponibil</span>
                : <span className="text-red-500 font-medium">Indisponibil</span>}
              {caregiver?.judet && <span> &bull; {caregiver.judet}</span>}
            </p>
          </div>
          <CaregiverActions profile={profileData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Contracte active" value={totalContracts} icon="📋" />
          <StatCard label="Check-in-uri azi" value={todayCheckins.length} icon="✅" />
          <StatCard label="Tarif zilnic" value={caregiver?.tarif ?? 0} icon="💰" suffix=" RON" />
        </div>

        {pendingRequests.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Cereri noi
              <span className="text-sm font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  id={req.id}
                  seniorName={req.seniorName}
                  seniorAge={req.seniorAge}
                  program={req.program}
                  startDate={req.startDate.toISOString()}
                  message={req.message}
                  familyEmail={req.family.user.email}
                  expiresAt={req.expiresAt.toISOString()}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contracte active</h2>
          {!caregiver?.contracts.length ? (
            <EmptyState icon="📋" title="Niciun contract activ" desc="Completează-ți profilul și documentele pentru a primi cereri de la familii." />
          ) : (
            <div className="space-y-6">
              {caregiver.contracts.map((contract) => (
                <div key={contract.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{contract.senior.nume}</p>
                      <p className="text-sm text-gray-500">
                        Familie: {contract.family.user.email} &bull; {contract.tarif} RON/zi
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Program: {contract.program}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <JournalButton contractId={contract.id} seniorNume={contract.senior.nume} />
                      <CheckinButton contractId={contract.id} />
                    </div>
                  </div>

                  {contract.checkins.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Check-in-uri recente</p>
                      <div className="flex gap-2 flex-wrap">
                        {contract.checkins.map((ch) => (
                          <span key={ch.id} className={`text-xs px-2.5 py-1 rounded-full font-medium ${ch.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                            {ch.type === 'IN' ? 'Sosire' : 'Plecare'}{' '}
                            {new Date(ch.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {contract.journals.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Jurnal recent</p>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                        {contract.journals[0].text}
                        {contract.journals[0].hasFlag && (
                          <span className="ml-2 text-amber-600 font-medium text-xs">&#9888; Semnalat</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documente</h2>
          {!caregiver?.documents.length ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <div className="text-3xl mb-3">📄</div>
              <p className="font-medium text-gray-700">Niciun document adăugat</p>
              <p className="text-sm text-gray-400 mt-1">Adaugă CI, cazier și certificatele pentru a fi verificat.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {caregiver.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{DOC_LABELS[doc.type] ?? doc.type}</p>
                    {doc.expiresAt && (
                      <p className="text-xs text-gray-400">Expiră: {new Date(doc.expiresAt).toLocaleDateString('ro-RO')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Vezi</a>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[doc.status] ?? doc.status}
                    </span>
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

function StatCard({ label, value, icon, suffix }: { label: string; value: number; icon: string; suffix?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-gray-900">
          {value}{suffix && <span className="text-base font-medium text-gray-500">{suffix}</span>}
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
