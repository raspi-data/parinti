'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TosModal() {
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function accept() {
    if (!checked) return
    setLoading(true)
    await fetch('/api/family/accept-tos', { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Termeni și Condiții</h2>
          <p className="text-sm text-gray-500 mt-1">
            Ai un contract activ — te rugăm să citești și să accepți termenii platformei.
          </p>
        </div>

        <div className="px-6 py-4 max-h-64 overflow-y-auto text-sm text-gray-600 space-y-3">
          <p><strong>1. Servicii intermediere.</strong> parinti.care este o platformă de intermediere între familii și îngrijitori profesioniști. Platforma nu este angajator și nu răspunde pentru serviciile prestate.</p>
          <p><strong>2. Calitatea serviciilor.</strong> Familia înțelege că evaluarea și selectarea îngrijitorului este responsabilitatea sa. parinti.care facilitează conectarea, dar nu garantează rezultatele.</p>
          <p><strong>3. Confidențialitate.</strong> Datele personale sunt prelucrate conform GDPR. Datele medicale ale seniorilor sunt accesibile exclusiv familiei și îngrijitorului contractat.</p>
          <p><strong>4. Reziliere.</strong> Contractul poate fi reziliat de oricare parte cu 7 zile preaviz. parinti.care poate suspenda accesul în caz de abuz al platformei.</p>
          <p><strong>5. Plăți.</strong> Tarifele sunt convenite direct între familie și îngrijitor. parinti.care poate percepe un comision de serviciu conform planului activ.</p>
          <p><strong>6. Modificări T&C.</strong> Termenii pot fi actualizați. Vei fi notificat înainte de intrarea în vigoare a modificărilor.</p>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-blue-600"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              Am citit și accept <strong>Termenii și Condițiile</strong> platformei parinti.care.
            </span>
          </label>

          <button
            onClick={accept}
            disabled={!checked || loading}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Se salvează...' : 'Acceptă și continuă'}
          </button>
        </div>
      </div>
    </div>
  )
}
