/* eslint-disable no-console */
import { prisma } from '../lib/db'

async function checkProxies() {
  const proxyCount = await prisma.proxy.count()
  console.log('Total proxies:', proxyCount)

  const activeProxies = await prisma.proxy.findMany({
    where: { status: 'active' },
    take: 5,
  })

  console.log('\nFirst 5 active proxies:')
  activeProxies.forEach((proxy: { host: string; port: number; provider: string | null }) => {
    console.log(`- ${proxy.host}:${proxy.port} (${proxy.provider})`)
  })

  await prisma.$disconnect()
}

checkProxies().catch(console.error)
