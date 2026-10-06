'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectSelector } from '@/components/jobs/project-selector'
import { AnalyticsSummary } from '@/components/analytics/analytics-summary'
import { JobsChart } from '@/components/analytics/jobs-chart'
import { DomainsChart } from '@/components/analytics/domains-chart'
import { ProxyPerformance } from '@/components/analytics/proxy-performance'
import { StatusDistribution } from '@/components/analytics/status-distribution'

interface AnalyticsData {
  summary: {
    totalJobs: number
    completedJobs: number
    failedJobs: number
    pendingJobs: number
    successRate: number
    avgExecutionTime: number
  }
  jobsByStatus: { status: string; count: number }[]
  jobsByDay: { date: string; count: number; completed: number; failed: number }[]
  topDomains: { domain: string; count: number; completed: number; failed: number }[]
  proxyPerformance: { 
    provider: string
    proxy_type: string
    total_requests: number
    successful_requests: number
    avg_execution_time: number
  }[]
}

export default function AnalyticsPage() {
  const [projectId, setProjectId] = useState<string>('')
  const [days, setDays] = useState<string>('7')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ days })
        if (projectId) params.append('projectId', projectId)

        const response = await fetch(`/api/analytics?${params}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [projectId, days])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor your scraping performance and usage patterns
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-64">
          <ProjectSelector
            value={projectId}
            onValueChange={setProjectId}
            placeholder="All Projects"
            allowAll
          />
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <AnalyticsSummary summary={analytics.summary} />

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Jobs Over Time */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Jobs Over Time</CardTitle>
                <CardDescription>
                  Daily job submissions and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JobsChart data={analytics.jobsByDay} />
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of job statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatusDistribution data={analytics.jobsByStatus} />
              </CardContent>
            </Card>

            {/* Top Domains */}
            <Card>
              <CardHeader>
                <CardTitle>Top Domains</CardTitle>
                <CardDescription>
                  Most frequently scraped domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainsChart data={analytics.topDomains} />
              </CardContent>
            </Card>

            {/* Proxy Performance */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Proxy Performance</CardTitle>
                <CardDescription>
                  Success rates and response times by proxy provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProxyPerformance data={analytics.proxyPerformance} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}