import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateProxySchema = z.object({
  status: z.enum(['active', 'failed', 'blacklisted']).optional(),
})

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params

  try {
    const body = await request.json()
    const { status } = updateProxySchema.parse(body)

    const proxy = await prisma.proxy.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(proxy)
  } catch (error) {
    console.error('Error updating proxy:', error)
    return NextResponse.json(
      { error: 'Failed to update proxy' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params

  try {
    // Soft delete by setting deletedAt
    await prisma.proxy.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'blacklisted',
      },
    })

    return NextResponse.json({ message: 'Proxy deleted successfully' })
  } catch (error) {
    console.error('Error deleting proxy:', error)
    return NextResponse.json(
      { error: 'Failed to delete proxy' },
      { status: 500 }
    )
  }
}