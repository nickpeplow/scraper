import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const jobId = params.id

    // Fetch job with result and project
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
      include: {
        result: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Transform to match the frontend Job interface
    const response = {
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
      result: job.result ? {
        html: job.result.scrapedData,
        error: job.result.errorMessage,
        statusCode: job.result.responseStatusCode,
        finalUrl: job.result.finalUrl,
        contentType: job.result.contentType,
        executionTime: job.result.executionTimeMs ? job.result.executionTimeMs / 1000 : undefined, // Convert to seconds
      } : undefined,
    }

    return NextResponse.json(response)
    } catch (error) {
      // Log error but don't expose details to client
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
