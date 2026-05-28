import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

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
    return NextResponse.json({ error: 'Contract negăsit' }, { status: 404 })
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
  page.drawText('CONTRACT DE ÎNGRIJIRE LA DOMICILIU', {
    x: 40, y: height - 72, size: 9, font: fontNormal, color: rgb(0.8, 0.8, 1),
  })

  y = height - 110

  const line = (label: string, value: string, indent = 40) => {
    page.drawText(label, { x: indent, y, size: 10, font: fontBold, color: gray })
    page.drawText(value, { x: indent + 160, y, size: 10, font: fontNormal, color: black })
    y -= 20
  }

  const section = (title: string) => {
    y -= 10
    page.drawRectangle({ x: 38, y: y - 4, width: width - 76, height: 22, color: rgb(0.94, 0.96, 1) })
    page.drawText(title, { x: 42, y: y + 4, size: 11, font: fontBold, color: blue })
    y -= 28
  }

  // ── Parties ──────────────────────────────────────────────────────
  section('PĂRȚI CONTRACTANTE')
  line('Familie (beneficiar):', contract.family.user.email)
  line('Județ familie:', contract.family.judet)
  line('Îngrijitor (prestator):', contract.caregiver.nume)
  line('Telefon îngrijitor:', contract.caregiver.phone)
  line('Județ îngrijitor:', contract.caregiver.judet)

  // ── Senior ───────────────────────────────────────────────────────
  section('PERSOANA ÎNGRIJITĂ (SENIOR)')
  line('Nume:', contract.senior.nume)
  line('Vârstă:', `${contract.senior.varsta} ani`)
  line('Județ:', contract.senior.judet)
  if (contract.senior.nevoi) line('Nevoi speciale:', contract.senior.nevoi)

  // ── Contract details ─────────────────────────────────────────────
  section('DETALII CONTRACT')
  line('Program:', contract.program)
  line('Data de start:', new Date(contract.startDate).toLocaleDateString('ro-RO'))
  line('Tarif zilnic:', `${contract.tarif} RON/zi`)
  line('Status:', contract.status)
  line('Nr. contract:', contract.id.slice(0, 8).toUpperCase())

  // ── Clauses ──────────────────────────────────────────────────────
  section('CLAUZE STANDARD')

  const clauses = [
    '1. Reziliere: oricare parte poate rezilia contractul cu 7 zile preaviz scris.',
    '2. Confidențialitate: îngrijitorul se obligă să păstreze confidențialitatea datelor medicale',
    '   și personale ale seniorului și familiei.',
    '3. Responsabilitate: prestatorul răspunde pentru calitatea serviciilor prestate conform',
    '   programului convenit.',
    '4. Plată: tarifele se achită conform programului agreat, prin mijloacele convenite.',
    '5. Modificări: orice modificare a prezentului contract se face prin acordul scris al ambelor',
    '   părți, prin intermediul platformei parinti.care.',
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
  page.drawText('Semnătura Familie', { x: 80, y, size: 9, font: fontNormal, color: gray })
  page.drawText('Semnătura Îngrijitor', { x: 370, y, size: 9, font: fontNormal, color: gray })

  // ── Footer ───────────────────────────────────────────────────────
  page.drawText(
    `Generat automat pe parinti.care · ${new Date().toLocaleDateString('ro-RO')}`,
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
