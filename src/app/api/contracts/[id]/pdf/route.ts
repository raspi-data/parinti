import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Helvetica (WinAnsi) does not support Romanian diacritics — strip them
function s(text: string): string {
  return text
    .replace(/[ăĂ]/g, 'a')
    .replace(/[âÂ]/g, 'a')
    .replace(/[îÎ]/g, 'i')
    .replace(/[șȘşŞ]/g, 's')
    .replace(/[țȚţŢ]/g, 't')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload || payload.role !== 'FAMILY') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      family: { include: { user: true } },
      caregiver: true,
      senior: true,
    },
  })

  if (!contract || contract.family.userId !== payload.sub) {
    return NextResponse.json({ error: 'Contract negasit' }, { status: 404 })
  }

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const fontBold   = await pdf.embedFont(StandardFonts.HelveticaBold)
  const fontNormal = await pdf.embedFont(StandardFonts.Helvetica)

  const blue  = rgb(0.15, 0.36, 0.78)
  const black = rgb(0, 0, 0)
  const gray  = rgb(0.4, 0.4, 0.4)

  let y = height - 60

  // Header bar
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue })
  page.drawText('parinti.care', { x: 40, y: height - 52, size: 22, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText('CONTRACT DE INGRIJIRE LA DOMICILIU', {
    x: 40, y: height - 72, size: 9, font: fontNormal, color: rgb(0.8, 0.8, 1),
  })

  y = height - 110

  const line = (label: string, value: string, indent = 40) => {
    // Truncate long values to avoid overflow
    const maxChars = 55
    const safeVal = value.length > maxChars ? value.slice(0, maxChars) + '...' : value
    page.drawText(label, { x: indent, y, size: 10, font: fontBold, color: gray })
    page.drawText(safeVal, { x: indent + 160, y, size: 10, font: fontNormal, color: black })
    y -= 20
  }

  const section = (title: string) => {
    y -= 10
    page.drawRectangle({ x: 38, y: y - 4, width: width - 76, height: 22, color: rgb(0.94, 0.96, 1) })
    page.drawText(title, { x: 42, y: y + 4, size: 11, font: fontBold, color: blue })
    y -= 28
  }

  // ── Parties ──────────────────────────────────────────────────────
  section('PARTI CONTRACTANTE')
  line('Familie (beneficiar):', contract.family.user.email)
  line('Judet familie:', s(contract.family.judet))
  line('Ingrijitor (prestator):', s(contract.caregiver.nume))
  line('Telefon ingrijitor:', contract.caregiver.phone)
  line('Judet ingrijitor:', s(contract.caregiver.judet))

  // ── Senior ───────────────────────────────────────────────────────
  section('PERSOANA INGRIJITA (SENIOR)')
  line('Nume:', s(contract.senior.nume))
  line('Varsta:', `${contract.senior.varsta} ani`)
  line('Judet:', s(contract.senior.judet))
  if (contract.senior.nevoi) line('Nevoi speciale:', s(contract.senior.nevoi))

  // ── Contract details ─────────────────────────────────────────────
  section('DETALII CONTRACT')
  line('Program:', s(contract.program))
  line('Data de start:', fmtDate(new Date(contract.startDate)))
  line('Tarif zilnic:', `${contract.tarif} RON/zi`)
  line('Status:', contract.status)
  line('Nr. contract:', contract.id.slice(0, 8).toUpperCase())

  // ── Clauses ──────────────────────────────────────────────────────
  section('CLAUZE STANDARD')

  const clauses = [
    '1. Reziliere: oricare parte poate rezilia contractul cu 7 zile preaviz scris.',
    '2. Confidentialitate: ingrijitorul se obliga sa pastreze confidentialitatea',
    '   datelor medicale si personale ale seniorului si familiei.',
    '3. Responsabilitate: prestatorul raspunde pentru calitatea serviciilor prestate',
    '   conform programului convenit.',
    '4. Plata: tarifele se achita conform programului agreat, prin mijloacele convenite.',
    '5. Modificari: orice modificare se face prin acordul scris al ambelor parti,',
    '   prin intermediul platformei parinti.care.',
  ]

  for (const clause of clauses) {
    page.drawText(clause, { x: 42, y, size: 9, font: fontNormal, color: black })
    y -= 16
  }

  // ── Signatures ───────────────────────────────────────────────────
  y -= 30
  page.drawLine({ start: { x: 42, y }, end: { x: 220, y }, thickness: 1, color: gray })
  page.drawLine({ start: { x: 340, y }, end: { x: 550, y }, thickness: 1, color: gray })
  y -= 18
  page.drawText('Semnatura Familie', { x: 80, y, size: 9, font: fontNormal, color: gray })
  page.drawText('Semnatura Ingrijitor', { x: 365, y, size: 9, font: fontNormal, color: gray })

  // ── Footer ───────────────────────────────────────────────────────
  page.drawText(
    `Generat automat pe parinti.care  |  ${fmtDate(new Date())}`,
    { x: 40, y: 28, size: 8, font: fontNormal, color: gray },
  )

  const pdfBytes = await pdf.save()
  const buffer = Buffer.from(pdfBytes)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="contract-${contract.id.slice(0, 8)}.pdf"`,
    },
  })
}
