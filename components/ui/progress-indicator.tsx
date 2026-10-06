import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ProgressIndicatorProps {
  status: 'pending' | 'running' | 'completed' | 'failed'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ProgressIndicator({ 
  status, 
  size = 'md', 
  showLabel = false,
  className 
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const labelClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const statusConfig = {
    pending: {
      icon: <div className={cn(sizeClasses[size], 'rounded-full bg-gray-300 animate-pulse')} />,
      label: 'Pending',
      color: 'text-gray-500'
    },
    running: {
      icon: <Loader2 className={cn(sizeClasses[size], 'animate-spin text-blue-500')} />,
      label: 'Running',
      color: 'text-blue-500'
    },
    completed: {
      icon: <div className={cn(sizeClasses[size], 'rounded-full bg-green-500')} />,
      label: 'Completed',
      color: 'text-green-500'
    },
    failed: {
      icon: <div className={cn(sizeClasses[size], 'rounded-full bg-red-500')} />,
      label: 'Failed',
      color: 'text-red-500'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {config.icon}
      {showLabel && (
        <span className={cn(labelClasses[size], config.color)}>
          {config.label}
        </span>
      )}
    </div>
  )
}

interface AnimatedProgressBarProps {
  progress?: number
  indeterminate?: boolean
  className?: string
}

export function AnimatedProgressBar({ 
  progress = 0, 
  indeterminate = false,
  className 
}: AnimatedProgressBarProps) {
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-200', className)}>
      {indeterminate ? (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      ) : (
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      )}
    </div>
  )
}

interface TimeElapsedProps {
  startTime: string
  endTime?: string
  className?: string
}

export function TimeElapsed({ startTime, endTime, className }: TimeElapsedProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (endTime) {
      // If job is complete, show final time
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
      setElapsed(duration)
      return
    }

    // Otherwise, update every second
    const interval = setInterval(() => {
      const duration = Date.now() - new Date(startTime).getTime()
      setElapsed(duration)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, endTime])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <span className={cn('text-sm text-muted-foreground', className)}>
      {formatTime(elapsed)}
    </span>
  )
}