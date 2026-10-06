import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'

const analyticsQuerySchema = z.object({
  projectId: z.string().optional(),
  days: z.coerce.number().min(1).max(90).default(7),
})

const USER_ID = 'test-user-id'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const { projectId, days } = analyticsQuerySchema.parse({
      projectId: searchParams.get('projectId') || undefined,
      days: searchParams.get('days') || 7,
    })

    const startDate = startOfDay(subDays(new Date(), days - 1))
    const endDate = endOfDay(new Date())

    const where: any = {
      userId: USER_ID,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (projectId) {
      where.projectId = projectId
    }

    // Get all jobs for the period
    const jobs = await prisma.job.findMany({
      where,
      include: {
        result: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calculate statistics
    const totalJobs = jobs.length
    const completedJobs = jobs.filter(j => j.status === 'completed').length
    const failedJobs = jobs.filter(j => j.status === 'failed').length
    const pendingJobs = jobs.filter(j => j.status === 'pending').length
    const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0

    // Calculate average execution time
    const executionTimes = jobs
      .filter(j => j.result?.executionTimeMs)
      .map(j => j.result!.executionTimeMs!)
    const avgExecutionTime = executionTimes.length > 0
      ? Math.round(executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length)
      : 0

    // Group jobs by status
    const jobsByStatus = Object.entries(
      jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({ status, count }))

    // Group jobs by day
    const jobsByDay = Object.entries(
      jobs.reduce((acc, job) => {
        const date = format(new Date(job.createdAt), 'yyyy-MM-dd')
        if (!acc[date]) {
          acc[date] = { total: 0, completed: 0, failed: 0 }
        }
        acc[date].total++
        if (job.status === 'completed') acc[date].completed++
        if (job.status === 'failed') acc[date].failed++
        return acc
      }, {} as Record<string, { total: number; completed: number; failed: number }>)
    ).map(([date, stats]) => ({
      date,
      count: stats.total,
      completed: stats.completed,
      failed: stats.failed,
    }))

    // Extract and count domains
    const domainRegex = /^(?:https?:\/\/)?(?:www\.)?([^\/]+)/
    const domainCounts = jobs.reduce((acc, job) => {
      const match = job.url.match(domainRegex)
      const domain = match ? match[1] : 'Unknown'
      if (!acc[domain]) {
        acc[domain] = { total: 0, completed: 0, failed: 0 }
      }
      acc[domain].total++
      if (job.status === 'completed') acc[domain].completed++
      if (job.status === 'failed') acc[domain].failed++
      return acc
    }, {} as Record<string, { total: number; completed: number; failed: number }>)

    const topDomains = Object.entries(domainCounts)
      .map(([domain, stats]) => ({
        domain,
        count: stats.total,
        completed: stats.completed,
        failed: stats.failed,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get proxy performance
    const jobsWithResults = jobs.filter(j => j.result)
    const proxyStats = jobsWithResults.reduce((acc, job) => {
      const key = job.result!.proxyId || 'direct'
      if (!acc[key]) {
        acc[key] = { total: 0, successful: 0, totalTime: 0 }
      }
      acc[key].total++
      if (job.status === 'completed') acc[key].successful++
      if (job.result!.executionTimeMs) {
        acc[key].totalTime += job.result!.executionTimeMs
      }
      return acc
    }, {} as Record<string, { total: number; successful: number; totalTime: number }>)

    // Get proxy details
    const proxyIds = Object.keys(proxyStats).filter(id => id !== 'direct')
    const proxies = proxyIds.length > 0
      ? await prisma.proxy.findMany({
          where: { id: { in: proxyIds } },
          select: { id: true, provider: true, proxyType: true },
        })
      : []

    const proxyPerformance = Object.entries(proxyStats)
      .map(([proxyId, stats]) => {
        const proxy = proxies.find(p => p.id === proxyId)
        return {
          provider: proxy?.provider || (proxyId === 'direct' ? 'Direct Connection' : 'Unknown'),
          proxy_type: proxy?.proxyType || (proxyId === 'direct' ? 'none' : 'unknown'),
          total_requests: stats.total,
          successful_requests: stats.successful,
          avg_execution_time: stats.total > 0 ? stats.totalTime / stats.total : 0,
        }
      })
      .sort((a, b) => b.total_requests - a.total_requests)

    // Format response
    return NextResponse.json({
      summary: {
        totalJobs,
        completedJobs,
        failedJobs,
        pendingJobs,
        successRate,
        avgExecutionTime,
      },
      jobsByStatus,
      jobsByDay,
      topDomains,
      proxyPerformance,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}