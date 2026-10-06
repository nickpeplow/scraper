import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scraperQueue } from '@/lib/queue'
import { createScrapeJobSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received request body:', body)

    // Validate request body
    const validatedData = createScrapeJobSchema.parse(body)

    // For now, use a fixed user ID
    const userId = 'test-user-id'

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: {
        id: validatedData.projectId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create job in database
    const job = await prisma.job.create({
      data: {
        url: validatedData.url,
        userId: userId,
        projectId: validatedData.projectId,
        status: 'pending',
        config: validatedData.options,
      },
    })

    // Add job to queue
    await scraperQueue.add(
      'scrape',
      {
        jobId: job.id,
        url: validatedData.url,
        useProxy: validatedData.options?.useProxy ?? true,
        headers: validatedData.options?.headers,
        timeout: validatedData.options?.timeout ?? 30000,
      },
      {
        jobId: job.id,
        priority: job.priority,
      }
    )

    // Create initial job event
    await prisma.jobEvent.create({
      data: {
        jobId: job.id,
        fromStatus: '',
        toStatus: 'pending',
        details: { message: 'Job created and queued' },
      },
    })

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      timestamp: job.createdAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 })
    }

    // Log error but don't expose details to client
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
