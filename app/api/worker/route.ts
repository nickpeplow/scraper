import { NextRequest, NextResponse } from 'next/server'
import { getWorkerStatus, checkWorkerHealth } from '@/lib/worker-manager'

export async function GET() {
  try {
    const status = await getWorkerStatus()
    
    // Check if worker is actually running
    if (status.status === 'running') {
      const isHealthy = await checkWorkerHealth()
      if (!isHealthy) {
        status.status = 'stopped'
      }
    }
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching worker status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch worker status' },
      { status: 500 }
    )
  }
}