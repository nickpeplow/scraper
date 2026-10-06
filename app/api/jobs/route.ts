import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// For now, use a fixed user ID until we implement proper authentication
const USER_ID = 'test-user-id'

const jobsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['all', 'pending', 'running', 'completed', 'failed']).optional(),
  projectId: z.string().optional(),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = jobsQuerySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      status: searchParams.get('status') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      search: searchParams.get('search') || undefined,
    })

    const where: any = {
      userId: USER_ID,
    }

    // Add status filter
    if (query.status && query.status !== 'all') {
      where.status = query.status
    }

    // Add project filter
    if (query.projectId) {
      where.projectId = query.projectId
    }

    // Add search filter
    if (query.search) {
      where.url = {
        contains: query.search,
        mode: 'insensitive',
      }
    }

    // Get total count
    const total = await prisma.job.count({ where })

    // Get paginated jobs
    const jobs = await prisma.job.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })

    // Transform the data to match the frontend interface
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      url: job.url,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      projectId: job.projectId,
      project: job.project ? {
        id: job.project.id,
        name: job.project.name,
      } : undefined,
    }))

    return NextResponse.json({
      jobs: transformedJobs,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}