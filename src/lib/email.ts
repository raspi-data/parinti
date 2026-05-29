import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM ?? 'parinti.care <noreply@parinti.care>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://parinti.care'

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping email to', to)
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[email] send error', err)
  }
}

export async function emailNewRequest(opts: {
  caregiverEmail: string
  caregiverNume: string
  familyEmail: string
  seniorName: string
  seniorAge: number
  program: string
  startDate: Date
  message?: string | null
  requestId: string
}) {
  const dashUrl = `${BASE_URL}/dashboard/caregiver`
  await send(
    opts.caregiverEmail,
    `Cerere nouă de îngrijire — ${opts.seniorName}`,
    `<p>Bună ${opts.caregiverNume},</p>
<p>Ai primit o cerere nouă de la familia <strong>${opts.familyEmail}</strong>.</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0">
  <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Senior</strong></td><td style="padding:6px 12px;border:1px solid #e5e7eb">${opts.seniorName}, ${opts.seniorAge} ani</td></tr>
  <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Program dorit</strong></td><td style="padding:6px 12px;border:1px solid #e5e7eb">${opts.program}</td></tr>
  <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Data start</strong></td><td style="padding:6px 12px;border:1px solid #e5e7eb">${new Date(opts.startDate).toLocaleDateString('ro-RO')}</td></tr>
  ${opts.message ? `<tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Mesaj</strong></td><td style="padding:6px 12px;border:1px solid #e5e7eb">${opts.message}</td></tr>` : ''}
</table>
<p><strong>Cererea expiră în 24 de ore.</strong></p>
<p><a href="${dashUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Acceptă sau refuză cererea</a></p>
<p style="color:#6b7280;font-size:12px">parinti.care — Platformă de îngrijire la domiciliu</p>`,
  )
}

export async function emailRequestAccepted(opts: {
  familyEmail: string
  caregiverNume: string
  caregiverPhone: string
  seniorName: string
  program: string
  startDate: Date
}) {
  await send(
    opts.familyEmail,
    `Cererea ta a fost acceptată — ${opts.caregiverNume}`,
    `<p>Vești bune! Îngrijitorul <strong>${opts.caregiverNume}</strong> a acceptat cererea ta.</p>
<p>Contractul a fost generat automat. Detalii:</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0">
  <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Îngrijitor</strong></td><td style="padding:6px 12px;border:1px solid #e5e7eb">${opts.caregiverNume}</td></tr>
  <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Telefon</strong></td><td style="padding:6px 12px;border:1px solid #e5e7eb"><strong>${opts.caregiverPhone}</strong></td></tr>
  <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Senior</strong></td><td style="padding:6px 12px;border:1px solid #e5e7eb">${opts.seniorName}</td></tr>
  <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Program</strong></td><td style="padding:6px 12px;border:1px solid #e5e7eb">${opts.program}</td></tr>
  <tr><td style="padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Data start</strong></td><td style="padding:6px 12px;border:1px solid #e5e7eb">${new Date(opts.startDate).toLocaleDateString('ro-RO')}</td></tr>
</table>
<p><a href="${BASE_URL}/dashboard/family" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Vezi dashboardul tău</a></p>
<p style="color:#6b7280;font-size:12px">parinti.care</p>`,
  )
}

export async function emailCaregiverContractCreated(opts: {
  caregiverEmail: string
  familyEmail: string
  seniorName: string
  program: string
}) {
  await send(
    opts.caregiverEmail,
    `Contract nou generat — ${opts.seniorName}`,
    `<p>Ai acceptat cererea și contractul a fost generat automat.</p>
<p>Familie: <strong>${opts.familyEmail}</strong> &bull; Senior: <strong>${opts.seniorName}</strong> &bull; Program: <strong>${opts.program}</strong></p>
<p><a href="${BASE_URL}/dashboard/caregiver" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Vezi contractul</a></p>
<p style="color:#6b7280;font-size:12px">parinti.care</p>`,
  )
}

export async function emailRequestDeclined(opts: {
  familyEmail: string
  caregiverNume: string
  alternatives: Array<{ nume: string; judet: string; tarif: number; slug: string | null }>
}) {
  const altHtml = opts.alternatives
    .map(
      (a) =>
        `<li><a href="${BASE_URL}/ingrijitori/${a.slug ?? ''}">${a.nume}</a> — ${a.judet}, ${a.tarif} RON/zi</li>`,
    )
    .join('')

  await send(
    opts.familyEmail,
    `Cererea ta nu a putut fi acceptată`,
    `<p>Ne pare rău, îngrijitorul <strong>${opts.caregiverNume}</strong> nu poate accepta cererea ta în acest moment.</p>
${opts.alternatives.length ? `<p>Îți recomandăm câțiva îngrijitori disponibili:</p><ul>${altHtml}</ul>` : ''}
<p><a href="${BASE_URL}/ingrijitori" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Caută alți îngrijitori</a></p>
<p style="color:#6b7280;font-size:12px">parinti.care</p>`,
  )
}

export async function emailMissedCheckin(opts: {
  familyEmail: string
  caregiverNume: string
  seniorNume: string
  contractId: string
}) {
  await send(
    opts.familyEmail,
    `Alertă: niciun check-in astăzi — ${opts.seniorNume}`,
    `<p>Bună ziua,</p>
<p>Îngrijitorul <strong>${opts.caregiverNume}</strong> nu a efectuat niciun check-in astăzi pentru seniorul <strong>${opts.seniorNume}</strong>.</p>
<p>Vă rugăm să contactați îngrijitorul pentru a verifica situația.</p>
<p><a href="${BASE_URL}/dashboard/family" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Vezi dashboardul</a></p>
<p style="color:#6b7280;font-size:12px">parinti.care — Alertă automată</p>`,
  )
}

export async function emailRequestExpired(opts: { familyEmail: string; caregiverNume: string }) {
  await send(
    opts.familyEmail,
    `Cererea ta a expirat fără răspuns`,
    `<p>Cererea ta către îngrijitorul <strong>${opts.caregiverNume}</strong> a expirat fără răspuns (24h).</p>
<p>Poți trimite o nouă cerere sau să alegi un alt îngrijitor.</p>
<p><a href="${BASE_URL}/ingrijitori" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Caută îngrijitori</a></p>
<p style="color:#6b7280;font-size:12px">parinti.care</p>`,
  )
}
