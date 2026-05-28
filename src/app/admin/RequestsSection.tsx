'use client'

import { useMemo, useState } from 'react'

export interface RequestRow {
  id: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  status: string
  seniorName: string
  seniorAge: number
  program: string
  startDate: string
  message: string | null
  family: { id: string; email: string; judet: string }
  caregiver: { id: string; nume: string; judet: string; phone: string; tarif: number; slug: string | null }
}

export interface Metrics {
  todayCount: number
  weekCount: number
  monthCount: number
  acceptanceRate: number
  avgResponseHours: number | null
}

interface Props {
  requests: RequestRow[]
  metrics: Metrics
  flaggedCaregiverIds: string[]
  flaggedFamilyIds: string[]
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'În așteptare', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACCEPTED: { label: 'Acceptat',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  DECLINED: { label: 'Refuzat',      cls: 'bg-red-100 text-red-700 border-red-200' },
  EXPIRED:  { label: 'Expirat',      cls: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const JUDETE = [
  'Alba','Arad','Arges','Bacau','Bihor','Bistrita-Nasaud','Botosani','Braila','Brasov',
  'Bucuresti','Buzau','Calarasi','Caras-Severin','Cluj','Constanta','Covasna','Dambovita',
  'Dolj','Galati','Giurgiu','Gorj','Harghita','Hunedoara','Ialomita','Iasi','Ilfov',
  'Maramures','Mehedinti','Mures','Neamt','Olt','Prahova','Salaj','Satu Mare','Sibiu',
  'Suceava','Teleorman','Timis','Tulcea','Valcea','Vaslui','Vrancea',
]

function fmt(d: string) {
  return new Date(d).toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function RequestsSection({ requests, metrics, flaggedCaregiverIds, flaggedFamilyIds }: Props) {
  const flaggedCaregivers = useMemo(() => new Set(flaggedCaregiverIds), [flaggedCaregiverIds])
  const flaggedFamilies   = useMemo(() => new Set(flaggedFamilyIds), [flaggedFamilyIds])

  const [statusFilter, setStatusFilter] = useState('')
  const [judetFilter, setJudetFilter]   = useState('')
  const [dateFilter, setDateFilter]     = useState('')
  const [selected, setSelected]         = useState<RequestRow | null>(null)

  const filtered = useMemo(() => {
    const now = Date.now()
    return requests.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (judetFilter && r.caregiver.judet !== judetFilter) return false
      if (dateFilter === 'today') {
        const d = new Date(); d.setHours(0, 0, 0, 0)
        if (new Date(r.createdAt) < d) return false
      }
      if (dateFilter === 'week') {
        if (now - new Date(r.createdAt).getTime() > 7 * 86400_000) return false
      }
      if (dateFilter === 'month') {
        const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0)
        if (new Date(r.createdAt) < d) return false
      }
      return true
    })
  }, [requests, statusFilter, judetFilter, dateFilter])

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Cereri azi" value={metrics.todayCount} />
        <MetricCard label="Această săptămână" value={metrics.weekCount} />
        <MetricCard label="Luna aceasta" value={metrics.monthCount} />
        <MetricCard
          label="Rată acceptare"
          value={`${metrics.acceptanceRate.toFixed(0)}%`}
          highlight={metrics.acceptanceRate >= 50}
        />
        <MetricCard
          label="Timp mediu răspuns"
          value={metrics.avgResponseHours != null ? `${metrics.avgResponseHours.toFixed(1)}h` : '—'}
        />
      </div>

      {/* Flags summary */}
      {(flaggedCaregiverIds.length > 0 || flaggedFamilyIds.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-wrap gap-4">
          {flaggedCaregiverIds.length > 0 && (
            <span className="text-sm text-red-700 font-medium">
              ⚠ {flaggedCaregiverIds.length} îngrijitor{flaggedCaregiverIds.length !== 1 ? 'i' : ''} cu 3+ refuzuri în 7 zile
            </span>
          )}
          {flaggedFamilyIds.length > 0 && (
            <span className="text-sm text-red-700 font-medium">
              ⚠ {flaggedFamilyIds.length} familie{flaggedFamilyIds.length !== 1 ? '' : ''} cu comportament spam (5+ cereri, 0 contracte)
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Toate</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Județ îngrijitor</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={judetFilter} onChange={(e) => setJudetFilter(e.target.value)}
            >
              <option value="">Toate</option>
              {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Perioadă</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">Toate</option>
              <option value="today">Azi</option>
              <option value="week">Ultima săptămână</option>
              <option value="month">Luna aceasta</option>
            </select>
          </div>
          {(statusFilter || judetFilter || dateFilter) && (
            <button
              onClick={() => { setStatusFilter(''); setJudetFilter(''); setDateFilter('') }}
              className="text-sm text-gray-500 hover:text-red-600 underline self-end mb-0.5"
            >
              Resetează
            </button>
          )}
          <span className="ml-auto self-end text-sm text-gray-400">{filtered.length} cereri</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Familie</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Îngrijitor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Program</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiră la</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">Nicio cerere găsită</td>
                </tr>
              ) : filtered.map((r) => {
                const st = STATUS_CFG[r.status] ?? STATUS_CFG.EXPIRED
                const caregiverFlagged = flaggedCaregivers.has(r.caregiver.id)
                const familyFlagged = flaggedFamilies.has(r.family.id)
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 font-medium truncate max-w-[160px]">{r.family.email}</p>
                      <p className="text-xs text-gray-400">{r.family.judet}</p>
                      {familyFlagged && <span className="text-xs text-red-600 font-medium">⚠ spam</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 font-medium">{r.caregiver.nume}</p>
                      <p className="text-xs text-gray-400">{r.caregiver.judet}</p>
                      {caregiverFlagged && <span className="text-xs text-red-600 font-medium">⚠ 3+ refuzuri</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.program}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {r.status === 'PENDING'
                        ? new Date(r.expiresAt).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <RequestDetailModal
          request={selected}
          caregiverFlagged={flaggedCaregivers.has(selected.caregiver.id)}
          familyFlagged={flaggedFamilies.has(selected.family.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function RequestDetailModal({
  request: r,
  caregiverFlagged,
  familyFlagged,
  onClose,
}: {
  request: RequestRow
  caregiverFlagged: boolean
  familyFlagged: boolean
  onClose: () => void
}) {
  const [notifying, setNotifying] = useState(false)
  const [notified, setNotified]   = useState(false)
  const [err, setErr]             = useState('')

  const st = STATUS_CFG[r.status] ?? STATUS_CFG.EXPIRED
  const isPending = r.status === 'PENDING'
  const pendingHours = isPending
    ? (Date.now() - new Date(r.createdAt).getTime()) / 3_600_000
    : 0
  const canNotify = isPending && pendingHours >= 12

  async function notify() {
    setNotifying(true); setErr('')
    const res = await fetch(`/api/admin/notify/${r.id}`, { method: 'POST' })
    setNotifying(false)
    if (!res.ok) { setErr('Eroare la trimitere'); return }
    setNotified(true)
  }

  const responseTime = r.status !== 'PENDING'
    ? ((new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / 3_600_000).toFixed(1)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Detalii cerere</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Timeline */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Istoric status</h3>
            <div className="space-y-2">
              <TimelineRow ts={r.createdAt} label="Cerere trimisă" status="PENDING" />
              {r.status !== 'PENDING' && (
                <TimelineRow ts={r.updatedAt} label={
                  r.status === 'ACCEPTED' ? `Acceptat${responseTime ? ` (după ${responseTime}h)` : ''}` :
                  r.status === 'DECLINED' ? `Refuzat${responseTime ? ` (după ${responseTime}h)` : ''}` :
                  'Expirat'
                } status={r.status} />
              )}
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Family */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                Familie
                {familyFlagged && <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-200">⚠ spam</span>}
              </h3>
              <InfoRow label="Email" value={r.family.email} />
              <InfoRow label="Județ" value={r.family.judet} />
            </section>

            {/* Caregiver */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                Îngrijitor
                {caregiverFlagged && <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-200">⚠ 3+ refuzuri</span>}
              </h3>
              <InfoRow label="Nume" value={r.caregiver.nume} />
              <InfoRow label="Județ" value={r.caregiver.judet} />
              <InfoRow label="Telefon" value={r.caregiver.phone} />
              <InfoRow label="Tarif" value={`${r.caregiver.tarif} RON/zi`} />
            </section>
          </div>

          {/* Senior / Request details */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Detalii cerere</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <InfoRow label="Senior" value={`${r.seniorName}, ${r.seniorAge} ani`} />
              <InfoRow label="Program dorit" value={r.program} />
              <InfoRow label="Data start" value={new Date(r.startDate).toLocaleDateString('ro-RO')} />
              <InfoRow label="Trimis la" value={fmt(r.createdAt)} />
              {r.status === 'PENDING' && (
                <InfoRow label="Expiră la" value={fmt(r.expiresAt)} />
              )}
            </div>
            {r.message && (
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-500 mb-1">Mesaj</p>
                <p className="text-sm text-blue-800">{r.message}</p>
              </div>
            )}
          </section>

          {/* Notify button */}
          {isPending && (
            <section className="pt-4 border-t border-gray-100">
              {canNotify ? (
                <div className="space-y-2">
                  <p className="text-xs text-amber-600">
                    Cererea este în așteptare de {pendingHours.toFixed(0)}h — poți trimite un reminder îngrijitorului.
                  </p>
                  {notified ? (
                    <p className="text-sm text-emerald-600 font-medium">✓ Notificare trimisă</p>
                  ) : (
                    <button
                      onClick={notify}
                      disabled={notifying}
                      className="bg-amber-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                    >
                      {notifying ? 'Se trimite...' : 'Notifică îngrijitorul'}
                    </button>
                  )}
                  {err && <p className="text-sm text-red-600">{err}</p>}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Notificarea manuală devine disponibilă după 12h de la trimitere
                  (în {(12 - pendingHours).toFixed(1)}h).
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function TimelineRow({ ts, label, status }: { ts: string; label: string; status: string }) {
  const dot: Record<string, string> = {
    PENDING: 'bg-amber-400', ACCEPTED: 'bg-emerald-500', DECLINED: 'bg-red-500', EXPIRED: 'bg-gray-400',
  }
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot[status] ?? 'bg-gray-400'}`} />
      <p className="text-sm text-gray-700">{label}</p>
      <p className="text-xs text-gray-400 ml-auto whitespace-nowrap">{fmt(ts)}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <span className="text-xs text-gray-400 shrink-0 w-24">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  )
}

function MetricCard({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${highlight ? 'border-emerald-300' : 'border-gray-200'}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
    </div>
  )
}
