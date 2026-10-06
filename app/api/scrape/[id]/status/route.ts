import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        result: true
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const response = {
      id: job.id,
      url: job.url,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      result: job.result ? {
        html: job.result.scrapedData ? (job.result.scrapedData as any).html : null,
        statusCode: job.result.responseStatusCode,
        contentType: job.result.contentType,
        finalUrl: job.result.finalUrl,
        executionTime: job.result.executionTimeMs,
        proxyUsed: job.result.proxyId,
        error: job.result.errorMessage
      } : null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}