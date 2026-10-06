'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  Timer
} from 'lucide-react'

interface AnalyticsSummaryProps {
  summary: {
    totalJobs: number
    completedJobs: number
    failedJobs: number
    pendingJobs: number
    successRate: number
    avgExecutionTime: number
  }
}

export function AnalyticsSummary({ summary }: AnalyticsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalJobs.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {summary.pendingJobs} pending
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.successRate}%</div>
          <p className="text-xs text-muted-foreground">
            {summary.completedJobs.toLocaleString()} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.failedJobs.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {summary.totalJobs > 0 ? Math.round((summary.failedJobs / summary.totalJobs) * 100) : 0}% failure rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Execution Time</CardTitle>
          <Timer className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(summary.avgExecutionTime / 1000).toFixed(1)}s
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.avgExecutionTime.toLocaleString()}ms
          </p>
        </CardContent>
      </Card>
    </div>
  )
}