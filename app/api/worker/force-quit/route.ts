import { NextRequest, NextResponse } from 'next/server'
import { forceQuitWorkers } from '@/lib/worker-manager'

export async function POST() {
  try {
    const result = await forceQuitWorkers()
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      killedProcesses: result.killed
    })
  } catch (error) {
    console.error('Error force quitting workers:', error)
    return NextResponse.json(
      { error: 'Failed to force quit workers' },
      { status: 500 }
    )
  }
}