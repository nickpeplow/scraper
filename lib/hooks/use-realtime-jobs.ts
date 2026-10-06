'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Job } from '@/lib/api-client'

interface RealtimeOptions {
  enabled?: boolean
  onJobUpdate?: (jobId: string, status: string) => void
  onJobComplete?: (jobId: string) => void
  onJobFailed?: (jobId: string, error?: string) => void
}

export function useRealtimeJobs(options: RealtimeOptions = {}) {
  const { 
    enabled = true, 
    onJobUpdate, 
    onJobComplete, 
    onJobFailed 
  } = options
  
  const [isConnected, setIsConnected] = useState(false)
  const [jobUpdates, setJobUpdates] = useState<Map<string, Partial<Job>>>(new Map())
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return

    try {
      const eventSource = new EventSource('/api/jobs/stream')
      eventSourceRef.current = eventSource

      eventSource.addEventListener('connected', () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        console.log('Connected to job updates stream')
      })

      eventSource.addEventListener('job:status_changed', (event) => {
        const data = JSON.parse(event.data)
        const { jobId, status } = data
        
        setJobUpdates(prev => {
          const updated = new Map(prev)
          updated.set(jobId, { ...updated.get(jobId), status })
          return updated
        })
        
        onJobUpdate?.(jobId, status)
      })

      eventSource.addEventListener('job:completed', (event) => {
        const data = JSON.parse(event.data)
        const { jobId } = data
        
        setJobUpdates(prev => {
          const updated = new Map(prev)
          updated.set(jobId, { ...updated.get(jobId), status: 'completed' })
          return updated
        })
        
        onJobComplete?.(jobId)
      })

      eventSource.addEventListener('job:failed', (event) => {
        const data = JSON.parse(event.data)
        const { jobId, error } = data
        
        setJobUpdates(prev => {
          const updated = new Map(prev)
          updated.set(jobId, { ...updated.get(jobId), status: 'failed' })
          return updated
        })
        
        onJobFailed?.(jobId, error)
      })

      eventSource.onerror = (event) => {
        console.warn('SSE connection interrupted, will retry...')
        setIsConnected(false)
        
        // Only close and reconnect if the connection is truly broken
        if (eventSource.readyState === EventSource.CLOSED) {
          eventSource.close()
          eventSourceRef.current = null
          
          // Exponential backoff for reconnection
          const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectAttemptsRef.current += 1
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current})...`)
            connect()
          }, backoffDelay)
        }
      }
    } catch (error) {
      console.warn('Failed to establish SSE connection, will use polling fallback')
      setIsConnected(false)
    }
  }, [enabled, onJobUpdate, onJobComplete, onJobFailed])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  const getJobUpdate = useCallback((jobId: string): Partial<Job> | undefined => {
    return jobUpdates.get(jobId)
  }, [jobUpdates])

  const clearJobUpdate = useCallback((jobId: string) => {
    setJobUpdates(prev => {
      const updated = new Map(prev)
      updated.delete(jobId)
      return updated
    })
  }, [])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    jobUpdates,
    getJobUpdate,
    clearJobUpdate,
  }
}

// Hook for polling fallback (for browsers that don't support SSE)
export function useJobPolling(jobId: string | null, interval = 2000) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return

    const fetchJob = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/jobs/${jobId}`)
        if (!response.ok) throw new Error('Failed to fetch job')
        const data = await response.json()
        setJob(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchJob()

    // Set up polling only if job is not in final state
    const pollInterval = setInterval(() => {
      if (job && (job.status === 'pending' || job.status === 'running')) {
        fetchJob()
      }
    }, interval)

    return () => clearInterval(pollInterval)
  }, [jobId, interval, job?.status])

  return { job, loading, error }
}