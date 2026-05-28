import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

try { process.loadEnvFile?.() } catch {}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[ăâ]/g, 'a')
    .replace(/[î]/g, 'i')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  const caregivers = await prisma.caregiver.findMany()
  for (const c of caregivers) {
    const slug = slugify(`${c.nume} ${c.judet}`)
    await prisma.caregiver.update({ where: { id: c.id }, data: { slug } })
    console.log(`  ${c.nume} → ${slug}`)
  }
  console.log('\nDone.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
