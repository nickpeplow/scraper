import { NextRequest, NextResponse } from 'next/server'
import { stopWorker } from '@/lib/worker-manager'

export async function POST() {
  try {
    const result = await stopWorker()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    console.error('Error stopping worker:', error)
    return NextResponse.json(
      { error: 'Failed to stop worker' },
      { status: 500 }
    )
  }
}