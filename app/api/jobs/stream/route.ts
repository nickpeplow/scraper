import { NextRequest, NextResponse } from 'next/server'
import { subscribeToJobEvents } from '@/lib/events/job-events'

// For now, use a fixed user ID until we implement proper authentication
const USER_ID = 'test-user-id'

export async function GET(request: NextRequest) {
  // Set up SSE headers
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  })

  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Subscribe to Redis events
  let unsubscribe: (() => void) | null = null

  // Set up the subscription
  ;(async () => {
    try {
      // Send initial connection event
      await writer.write(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ connected: true })}\n\n`)
      )

      // Subscribe to job events for this user
      unsubscribe = await subscribeToJobEvents(USER_ID, async (event) => {
        try {
          const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify({
            jobId: event.jobId,
            projectId: event.projectId,
            ...event.data
          })}\n\n`
          
          await writer.write(encoder.encode(sseMessage))
        } catch (error) {
          console.error('Error writing SSE event:', error)
        }
      })

      // Keep connection alive with periodic heartbeat
      const heartbeatInterval = setInterval(async () => {
        try {
          await writer.write(encoder.encode(': heartbeat\n\n'))
        } catch (error) {
          clearInterval(heartbeatInterval)
        }
      }, 30000) // 30 seconds

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        if (unsubscribe) {
          unsubscribe()
        }
        writer.close()
      })
    } catch (error) {
      console.error('SSE stream setup error:', error)
      // Send error event before closing
      try {
        await writer.write(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to establish connection' })}\n\n`)
        )
      } catch {}
      writer.close()
    }
  })()

  return new NextResponse(stream.readable, {
    headers: responseHeaders,
  })
}

// Disable static generation for this route
export const dynamic = 'force-dynamic'