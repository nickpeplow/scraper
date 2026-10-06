import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const USER_ID = 'test-user-id'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: USER_ID,
      },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get recent jobs for this project
    const jobs = await prisma.job.findMany({
      where: {
        projectId: id,
        userId: USER_ID,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 jobs
    })

    return NextResponse.json({
      project,
      jobs,
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}