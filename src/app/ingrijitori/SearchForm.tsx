'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const JUDETE = [
  'Alba','Arad','Arges','Bacau','Bihor','Bistrita-Nasaud','Botosani','Braila','Brasov',
  'Bucuresti','Buzau','Calarasi','Caras-Severin','Cluj','Constanta','Covasna','Dambovita',
  'Dolj','Galati','Giurgiu','Gorj','Harghita','Hunedoara','Ialomita','Iasi','Ilfov',
  'Maramures','Mehedinti','Mures','Neamt','Olt','Prahova','Salaj','Satu Mare','Sibiu',
  'Suceava','Teleorman','Timis','Tulcea','Valcea','Vaslui','Vrancea',
]

export default function SearchForm() {
  const router = useRouter()
  const params = useSearchParams()

  const judet = params.get('judet') ?? ''
  const maxTarif = params.get('maxTarif') ?? ''
  const minExp = params.get('minExp') ?? ''

  const update = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(params.toString())
      if (value) p.set(key, value)
      else p.delete(key)
      router.push(`/ingrijitori?${p.toString()}`)
    },
    [params, router],
  )

  const hasFilters = judet || maxTarif || minExp

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Județ</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={judet}
            onChange={(e) => update('judet', e.target.value)}
          >
            <option value="">Toate județele</option>
            {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Tarif maxim (RON/zi)</label>
          <input
            type="number" min="0" step="10" placeholder="ex: 200"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={maxTarif}
            onChange={(e) => update('maxTarif', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Experiență minimă (ani)</label>
          <input
            type="number" min="0" max="50" placeholder="ex: 3"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={minExp}
            onChange={(e) => update('minExp', e.target.value)}
          />
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => router.push('/ingrijitori')}
            className="text-sm text-gray-500 hover:text-red-600 underline"
          >
            Șterge filtrele
          </button>
        </div>
      )}
    </div>
  )
}
