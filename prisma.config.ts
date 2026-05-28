import path from 'node:path'
import { defineConfig } from 'prisma/config'

try { process.loadEnvFile?.() } catch {}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
