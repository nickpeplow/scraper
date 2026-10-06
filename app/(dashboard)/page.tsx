'use client'

import { useEffect, useState, useCallback } from 'react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentJobs } from '@/components/dashboard/recent-jobs'
import { WorkerControl } from '@/components/worker/worker-control'
import { Button } from '@/components/ui/button'
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Globe,
  TrendingUp,
  Clock,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { getDashboardStats, getRecentJobs } from '@/lib/api-client'
import type { DashboardStats, Job } from '@/lib/api-client'
import { useRealtimeJobs } from '@/lib/hooks/use-realtime-jobs'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  // Load data function
  const loadData = useCallback(async () => {
    try {
      const [statsData, jobsData] = await Promise.all([
        getDashboardStats(),
        getRecentJobs(),
      ])
      setStats(statsData)
      setRecentJobs(jobsData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Set up real-time updates
  const { isConnected } = useRealtimeJobs({
    onJobUpdate: useCallback((jobId, status) => {
      // Update job status in recent jobs list
      setRecentJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { ...job, status } : job
        )
      )
    }, []),
    onJobComplete: useCallback((jobId) => {
      // Reload stats when a job completes
      loadData()
    }, [loadData]),
    onJobFailed: useCallback((jobId) => {
      // Reload stats when a job fails
      loadData()
    }, [loadData]),
  })

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Overview of your scraping operations
            </p>
            {isConnected && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                Live
              </div>
            )}
          </div>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Jobs"
          value={stats?.totalJobs || 0}
          description="All time"
          icon={Briefcase}
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          description="Last 30 days"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Active Proxies"
          value={stats?.activeProxies || 0}
          description="Available for use"
          icon={Globe}
        />
        <StatsCard
          title="Avg. Time"
          value={`${stats?.averageExecutionTime || 0}s`}
          description="Per job"
          icon={Clock}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Completed"
          value={stats?.completedJobs || 0}
          description="Successfully scraped"
          icon={CheckCircle2}
        />
        <StatsCard
          title="Failed"
          value={stats?.failedJobs || 0}
          description="Need attention"
          icon={XCircle}
        />
        <StatsCard
          title="Running"
          value={
            recentJobs.filter((job) => job.status === 'running').length || 0
          }
          description="Currently processing"
          icon={Clock}
        />
      </div>

      {/* Worker Control and Recent Jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WorkerControl />
        <RecentJobs jobs={recentJobs} loading={loading} />
      </div>
    </div>
  )
}