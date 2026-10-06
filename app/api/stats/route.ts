import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const USER_ID = 'test-user-id'

export async function GET() {
  try {
    // Get job statistics
    const [
      totalJobs,
      completedJobs,
      failedJobs,
      activeProxies,
      jobs,
    ] = await Promise.all([
      // Total jobs count
      prisma.job.count({
        where: { userId: USER_ID },
      }),
      
      // Completed jobs count
      prisma.job.count({
        where: {
          userId: USER_ID,
          status: 'completed',
        },
      }),
      
      // Failed jobs count
      prisma.job.count({
        where: {
          userId: USER_ID,
          status: 'failed',
        },
      }),
      
      // Active proxies count
      prisma.proxy.count({
        where: {
          status: 'active',
          deletedAt: null,
        },
      }),
      
      // Get recent jobs for calculating average execution time
      prisma.job.findMany({
        where: {
          userId: USER_ID,
          status: 'completed',
        },
        include: {
          result: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 100, // Sample last 100 completed jobs
      }),
    ])

    // Calculate success rate
    const successRate = totalJobs > 0 
      ? Math.round((completedJobs / totalJobs) * 100)
      : 0

    // Calculate average execution time
    const executionTimes = jobs
      .filter(job => job.result?.executionTimeMs)
      .map(job => job.result!.executionTimeMs!)
    
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length / 1000 // Convert to seconds
      : 0

    return NextResponse.json({
      totalJobs,
      completedJobs,
      failedJobs,
      activeProxies,
      successRate,
      averageExecutionTime: Math.round(averageExecutionTime * 10) / 10, // Round to 1 decimal
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}