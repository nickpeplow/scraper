'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, Play, Square, RefreshCw, Activity, AlertCircle, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface WorkerStatus {
  status: 'running' | 'stopped' | 'starting' | 'stopping'
  pid?: number
  startedAt?: string
  stoppedAt?: string
  lastHeartbeat?: string
}

export function WorkerControl() {
  const [status, setStatus] = useState<WorkerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch worker status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/worker')
      if (!response.ok) throw new Error('Failed to fetch worker status')
      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch worker status')
      console.error('Error fetching worker status:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Start worker
  const startWorker = async () => {
    setActionLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/worker/start', { method: 'POST' })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start worker')
      }
      
      // Refresh status after a short delay
      setTimeout(fetchStatus, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start worker')
    } finally {
      setActionLoading(false)
    }
  }

  // Stop worker
  const stopWorker = async () => {
    setActionLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/worker/stop', { method: 'POST' })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop worker')
      }
      
      // Refresh status after a short delay
      setTimeout(fetchStatus, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop worker')
    } finally {
      setActionLoading(false)
    }
  }

  // Force quit workers
  const forceQuitWorkers = async () => {
    setActionLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/worker/force-quit', { method: 'POST' })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to force quit workers')
      }
      
      // Show success message
      if (data.killedProcesses && data.killedProcesses.length > 0) {
        setError(`Force quit ${data.killedProcesses.length} worker process(es): ${data.killedProcesses.join(', ')}`)
      } else {
        setError('No worker processes found to kill')
      }
      
      // Refresh status after a short delay
      setTimeout(fetchStatus, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force quit workers')
    } finally {
      setActionLoading(false)
    }
  }

  // Auto-refresh status
  useEffect(() => {
    fetchStatus()
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchStatus, 5000)
    
    return () => clearInterval(interval)
  }, [fetchStatus])

  const getStatusBadge = (status: WorkerStatus['status']) => {
    switch (status) {
      case 'running':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Running
            </div>
          </Badge>
        )
      case 'stopped':
        return (
          <Badge variant="secondary" className="px-3 py-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              Stopped
            </div>
          </Badge>
        )
      case 'starting':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Starting...
            </div>
          </Badge>
        )
      case 'stopping':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-1">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Stopping...
            </div>
          </Badge>
        )
    }
  }

  const getStatusIcon = (status: WorkerStatus['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="h-6 w-6 text-green-500" />
      case 'stopped':
        return <Square className="h-6 w-6 text-gray-400" />
      case 'starting':
      case 'stopping':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Worker Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {status && getStatusIcon(status.status)}
            </div>
            <div>
              <CardTitle className="text-xl">Worker Control</CardTitle>
              <CardDescription>
                Manage the background job processing worker
              </CardDescription>
            </div>
          </div>
          {status && getStatusBadge(status.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={startWorker}
            disabled={actionLoading || status?.status === 'running' || status?.status === 'starting'}
            size="lg"
            className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {actionLoading && status?.status !== 'running' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Start Worker
          </Button>
          
          <Button
            onClick={stopWorker}
            variant="destructive"
            size="lg"
            disabled={actionLoading || status?.status === 'stopped' || status?.status === 'stopping'}
            className="flex-1 min-w-[140px] shadow-sm"
          >
            {actionLoading && status?.status === 'running' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Square className="mr-2 h-4 w-4" />
            )}
            Stop Worker
          </Button>
          
          <div className="flex gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={actionLoading}
                  className="shadow-sm"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Force Quit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Force Quit All Workers?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will forcefully terminate all worker processes, including any that may be stuck or unresponsive. 
                    Any jobs currently being processed will be interrupted and may need to be retried.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={forceQuitWorkers} className="bg-red-600 hover:bg-red-700">
                    Force Quit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              onClick={fetchStatus}
              variant="outline"
              size="icon"
              className="h-11 w-11 shadow-sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {status && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
            {status.status === 'running' && status.pid && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Process ID</span>
                <span className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded">{status.pid}</span>
              </div>
            )}
            
            {status.startedAt && status.status === 'running' && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {formatDistanceToNow(new Date(status.startedAt), { addSuffix: false })}
                </span>
              </div>
            )}
            
            {status.stoppedAt && status.status === 'stopped' && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Stopped</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(status.stoppedAt), { addSuffix: true })}
                </span>
              </div>
            )}
            
            {status.lastHeartbeat && status.status === 'running' && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Health Check</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(status.lastHeartbeat), { addSuffix: true })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {status?.status === 'stopped' && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              The worker is not running. Jobs will queue up until the worker is started.
            </AlertDescription>
          </Alert>
        )}
        
        {status?.status === 'running' && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Worker is processing jobs. All systems operational.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}