import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'test-user-id',
      email: 'test@example.com',
      apiKey: crypto.randomBytes(32).toString('hex'),
    },
  })

  console.log('Created test user:', testUser)

  // Create a test project
  const testProject = await prisma.project.upsert({
    where: { id: 'test-project-id' },
    update: {},
    create: {
      id: 'test-project-id',
      userId: testUser.id,
      name: 'Test Project',
      description: 'A test project for development',
      settings: {
        defaultTimeout: 30000,
        defaultHeaders: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
    },
  })

  console.log('Created test project:', testProject)

  // Import proxies from the file
  const fs = await import('fs/promises')
  const proxyFilePath = '/Users/nickpeplow/Downloads/Webshare 100 proxies.txt'

  try {
    const proxyData = await fs.readFile(proxyFilePath, 'utf-8')
    const proxyLines = proxyData.trim().split('\n')

    for (const line of proxyLines) {
      const parts = line.split(':')
      if (parts.length >= 4) {
        const host = parts[0]
        const port = parseInt(parts[1])
        const username = parts[2]
        const password = parts[3]

        await prisma.proxy.upsert({
          where: {
            host_port: { host, port },
          },
          update: {},
          create: {
            host,
            port,
            username,
            password,
            protocol: 'http',
            proxyType: 'datacenter',
            provider: 'webshare',
            countryCode: 'US',
          },
        })
      }
    }

    console.log(`Imported ${proxyLines.length} proxies`)
  } catch (error) {
    console.error('Could not import proxies:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
