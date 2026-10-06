import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateApiKey } from '@/lib/utils'
import { z } from 'zod'

// For demo purposes, using a hardcoded user ID
const USER_ID = 'test-user-id'

export async function GET() {
  try {
    // Get user's API keys (masked)
    const user = await prisma.user.findUnique({
      where: { id: USER_ID },
      select: {
        id: true,
        email: true,
        apiKeys: {
          select: {
            id: true,
            name: true,
            key: true,
            lastUsedAt: true,
            createdAt: true,
            expiresAt: true,
            _count: {
              select: { jobs: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Mask API keys for security
    const maskedKeys = user.apiKeys.map(key => ({
      ...key,
      key: `${key.key.substring(0, 7)}...${key.key.substring(key.key.length - 4)}`,
      jobCount: key._count.jobs
    }))

    return NextResponse.json({
      apiKeys: maskedKeys,
      email: user.email
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresIn: z.enum(['30d', '90d', '365d', 'never']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, expiresIn } = createApiKeySchema.parse(body)

    // Calculate expiration date
    let expiresAt = null
    if (expiresIn && expiresIn !== 'never') {
      const days = parseInt(expiresIn)
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)
    }

    // Generate new API key
    const apiKey = generateApiKey()

    // Save to database
    const newKey = await prisma.apiKey.create({
      data: {
        userId: USER_ID,
        name,
        key: apiKey,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        key: true,
        createdAt: true,
        expiresAt: true,
      }
    })

    // Return the full key only on creation
    return NextResponse.json({
      ...newKey,
      message: 'Save this API key securely. You won\'t be able to see it again.',
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create API key' },
      { status: 500 }
    )
  }
}