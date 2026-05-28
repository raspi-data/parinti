import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

try { process.loadEnvFile?.() } catch {}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const PASSWORD = 'Test1234!'

const caregivers = [
  {
    email: 'maria.constantin@test.com',
    nume: 'Maria Constantin',
    phone: '0721 111 001',
    judet: 'Bucuresti',
    experienta: 5,
    tarif: 180,
    disponibil: true,
    bio: 'Ingrijitoare cu experienta in asistenta persoanelor varstnice cu afectiuni cronice. Certificata ANC, cu cursuri de prim ajutor si administrare medicamente.',
  },
  {
    email: 'elena.popa@test.com',
    nume: 'Elena Popa',
    phone: '0731 222 002',
    judet: 'Cluj',
    experienta: 8,
    tarif: 200,
    disponibil: true,
    bio: 'Specializata in ingrijirea pacientilor cu dementa si Alzheimer. Am lucrat 3 ani in Germania si 5 ani in Romania. Rabdatoare, empatica, punctuala.',
  },
  {
    email: 'ion.dumitrescu@test.com',
    nume: 'Ion Dumitrescu',
    phone: '0741 333 003',
    judet: 'Timis',
    experienta: 3,
    tarif: 150,
    disponibil: true,
    bio: 'Ingrijitor format prin cursuri ANC, cu experienta in mobilizarea pacientilor si recuperare post-operatorie. Disponibil program flexibil.',
  },
  {
    email: 'ana.gheorghe@test.com',
    nume: 'Ana Gheorghe',
    phone: '0751 444 004',
    judet: 'Iasi',
    experienta: 6,
    tarif: 170,
    disponibil: true,
    bio: 'Foste asistenta medicala cu reconversie in ingrijire la domiciliu. Experienta cu pacientii postAVC, diabet tip 2, hipertensiune. Foarte organizata.',
  },
  {
    email: 'gheorghe.stancu@test.com',
    nume: 'Gheorghe Stancu',
    phone: '0761 555 005',
    judet: 'Constanta',
    experienta: 4,
    tarif: 160,
    disponibil: true,
    bio: 'Ingrijitor certificat cu experienta in kinetoterapie usoara si exercitii de mobilitate. Lucrez cu multa caldura si respect cu fiecare pacient.',
  },
  {
    email: 'ioana.marin@test.com',
    nume: 'Ioana Marin',
    phone: '0771 666 006',
    judet: 'Brasov',
    experienta: 10,
    tarif: 220,
    disponibil: true,
    bio: 'Deceniu de experienta in ingrijirea persoanelor varstnice. Specialist in nutritie geriatrica si stimulare cognitiva. Referinte excelente disponibile.',
  },
  {
    email: 'cristina.dinu@test.com',
    nume: 'Cristina Dinu',
    phone: '0781 777 007',
    judet: 'Prahova',
    experienta: 2,
    tarif: 140,
    disponibil: true,
    bio: 'Tanara ingrijitoare cu certificare ANC si curs CPR. Energica, dedicata, dispusa sa invete. Prefer program de zi, zona Ploiesti si imprejurimi.',
  },
  {
    email: 'mihai.ionescu@test.com',
    nume: 'Mihai Ionescu',
    phone: '0791 888 008',
    judet: 'Bucuresti',
    experienta: 7,
    tarif: 190,
    disponibil: true,
    bio: 'Ingrijitor masculin recomandat pentru pacienti cu mobilitate redusa sau care necesita sprijin fizic. Fostul asistent medical la spital, experienta in urgente.',
  },
]

async function main() {
  console.log('Seeding caregivers...')
  const hashedPassword = await hash(PASSWORD, 12)

  for (const c of caregivers) {
    const existing = await prisma.user.findUnique({ where: { email: c.email } })
    if (existing) {
      console.log(`  skip (exists): ${c.email}`)
      continue
    }

    const user = await prisma.user.create({
      data: {
        email: c.email,
        password: hashedPassword,
        role: 'CAREGIVER',
        caregiver: {
          create: {
            nume: c.nume,
            phone: c.phone,
            judet: c.judet,
            experienta: c.experienta,
            tarif: c.tarif,
            disponibil: c.disponibil,
            bio: c.bio,
          },
        },
      },
    })
    console.log(`  created: ${c.email} (${c.judet}, ${c.tarif} RON/zi)`)
  }

  console.log(`\nDone. Password for all test accounts: ${PASSWORD}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
