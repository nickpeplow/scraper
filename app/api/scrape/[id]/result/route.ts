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

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Job not completed', status: job.status },
        { status: 400 }
      )
    }

    if (!job.result) {
      return NextResponse.json(
        { error: 'No result found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      html: job.result.scrapedData ? (job.result.scrapedData as any).html : null,
      statusCode: job.result.responseStatusCode,
      contentType: job.result.contentType,
      finalUrl: job.result.finalUrl,
      executionTime: job.result.executionTimeMs,
      proxyUsed: job.result.proxyId
    })
  } catch (error) {
    console.error('Error fetching job result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}