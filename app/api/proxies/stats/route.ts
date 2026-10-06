import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [
      totalProxies,
      activeProxies,
      failedProxies,
      providers,
      types,
      countries,
      recentActivity,
    ] = await Promise.all([
      prisma.proxy.count({ where: { deletedAt: null } }),
      prisma.proxy.count({ where: { status: 'active', deletedAt: null } }),
      prisma.proxy.count({ where: { status: 'failed', deletedAt: null } }),
      prisma.proxy.groupBy({
        by: ['provider'],
        where: { deletedAt: null },
        _count: true,
      }),
      prisma.proxy.groupBy({
        by: ['proxyType'],
        where: { deletedAt: null },
        _count: true,
      }),
      prisma.proxy.groupBy({
        by: ['countryCode'],
        where: { deletedAt: null, countryCode: { not: null } },
        _count: true,
      }),
      prisma.proxy.findMany({
        where: {
          deletedAt: null,
          lastUsedAt: { not: null },
        },
        select: {
          id: true,
          host: true,
          port: true,
          lastUsedAt: true,
          successCount: true,
          failureCount: true,
        },
        orderBy: { lastUsedAt: 'desc' },
        take: 10,
      }),
    ])

    // Calculate overall success rate
    const overallStats = await prisma.proxy.aggregate({
      where: { deletedAt: null },
      _sum: {
        successCount: true,
        failureCount: true,
      },
    })

    const totalRequests = (overallStats._sum.successCount || 0) + (overallStats._sum.failureCount || 0)
    const overallSuccessRate = totalRequests > 0
      ? Math.round(((overallStats._sum.successCount || 0) / totalRequests) * 100)
      : 0

    return NextResponse.json({
      summary: {
        total: totalProxies,
        active: activeProxies,
        failed: failedProxies,
        blacklisted: totalProxies - activeProxies - failedProxies,
        successRate: overallSuccessRate,
      },
      byProvider: providers.map(p => ({
        provider: p.provider,
        count: p._count,
      })),
      byType: types.map(t => ({
        type: t.proxyType,
        count: t._count,
      })),
      byCountry: countries.map(c => ({
        country: c.countryCode,
        count: c._count,
      })),
      recentActivity: recentActivity.map(proxy => ({
        ...proxy,
        successRate: proxy.successCount + proxy.failureCount > 0
          ? Math.round((proxy.successCount / (proxy.successCount + proxy.failureCount)) * 100)
          : 0,
      })),
    })
  } catch (error) {
    console.error('Error fetching proxy stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proxy statistics' },
      { status: 500 }
    )
  }
}