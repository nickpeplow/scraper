import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface AuthContext {
  user: {
    id: string
    email: string
  }
}

export async function validateApiKey(
  request: NextRequest
): Promise<{ isValid: boolean; context?: AuthContext; error?: string }> {
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return {
      isValid: false,
      error: 'Missing API key. Please provide an API key in the x-api-key header.',
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { apiKey },
      select: { id: true, email: true },
    })

    if (!user) {
      return {
        isValid: false,
        error: 'Invalid API key.',
      }
    }

    return {
      isValid: true,
      context: { user },
    }
  } catch (error) {
    logger.error('Error validating API key:', error)
    return {
      isValid: false,
      error: 'Internal server error.',
    }
  }
}

export function withAuth<T extends Record<string, unknown>>(
  handler: (request: NextRequest, context: T & { auth: AuthContext }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T) => {
    const { isValid, context: authContext, error } = await validateApiKey(request)

    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 })
    }

    return handler(request, { ...context, auth: authContext! })
  }
}
