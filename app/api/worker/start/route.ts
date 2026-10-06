import { NextRequest, NextResponse } from 'next/server'
import { startWorker } from '@/lib/worker-manager'

export async function POST() {
  try {
    const result = await startWorker()
    
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
    console.error('Error starting worker:', error)
    return NextResponse.json(
      { error: 'Failed to start worker' },
      { status: 500 }
    )
  }
}