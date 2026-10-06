import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const proxyFilterSchema = z.object({
  status: z.enum(['active', 'failed', 'blacklisted']).optional(),
  provider: z.string().optional(),
  proxyType: z.enum(['datacenter', 'residential', 'mobile']).optional(),
  countryCode: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = proxyFilterSchema.parse({
      status: searchParams.get('status') || undefined,
      provider: searchParams.get('provider') || undefined,
      proxyType: searchParams.get('proxyType') || undefined,
      countryCode: searchParams.get('countryCode') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    })

    const where: any = {}
    if (filters.status) where.status = filters.status
    if (filters.provider) where.provider = filters.provider
    if (filters.proxyType) where.proxyType = filters.proxyType
    if (filters.countryCode) where.countryCode = filters.countryCode

    const [proxies, total] = await Promise.all([
      prisma.proxy.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          host: true,
          port: true,
          protocol: true,
          proxyType: true,
          provider: true,
          countryCode: true,
          status: true,
          lastUsedAt: true,
          failureCount: true,
          successCount: true,
          lastError: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.proxy.count({ where }),
    ])

    // Calculate success rate for each proxy
    const proxiesWithStats = proxies.map(proxy => ({
      ...proxy,
      successRate: proxy.successCount + proxy.failureCount > 0
        ? Math.round((proxy.successCount / (proxy.successCount + proxy.failureCount)) * 100)
        : 0,
    }))

    return NextResponse.json({
      proxies: proxiesWithStats,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    })
  } catch (error) {
    console.error('Error fetching proxies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proxies' },
      { status: 500 }
    )
  }
}

// Import proxies from text
const importProxiesSchema = z.object({
  proxies: z.string(),
  provider: z.string().min(1),
  proxyType: z.enum(['datacenter', 'residential', 'mobile']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { proxies: proxyText, provider, proxyType } = importProxiesSchema.parse(body)

    const lines = proxyText.split('\n').filter(line => line.trim())
    const proxyData = []

    for (const line of lines) {
      const parts = line.trim().split(':')
      if (parts.length >= 4) {
        const [host, port, username, password] = parts
        
        // Check if proxy already exists
        const exists = await prisma.proxy.findFirst({
          where: { host, port: parseInt(port) },
        })

        if (!exists) {
          proxyData.push({
            host,
            port: parseInt(port),
            username,
            password,
            protocol: 'http',
            proxyType,
            provider,
            status: 'active',
          })
        }
      }
    }

    // Bulk insert new proxies
    if (proxyData.length > 0) {
      await prisma.proxy.createMany({
        data: proxyData,
        skipDuplicates: true,
      })
    }

    return NextResponse.json({
      imported: proxyData.length,
      total: lines.length,
      message: `Successfully imported ${proxyData.length} new proxies`,
    })
  } catch (error) {
    console.error('Error importing proxies:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import proxies' },
      { status: 500 }
    )
  }
}