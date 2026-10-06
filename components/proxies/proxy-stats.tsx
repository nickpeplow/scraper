'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Server,
  TrendingUp,
  Globe
} from 'lucide-react'

interface ProxyStats {
  summary: {
    total: number
    active: number
    failed: number
    blacklisted: number
    successRate: number
  }
  byProvider: { provider: string; count: number }[]
  byType: { type: string; count: number }[]
  byCountry: { country: string; count: number }[]
}

interface ProxyStatsProps {
  refreshKey?: number
}

export function ProxyStats({ refreshKey }: ProxyStatsProps) {
  const [stats, setStats] = useState<ProxyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/proxies/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch proxy stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [refreshKey])

  if (loading) {
    return (
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
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proxies</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.total}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {stats.byProvider.length} providers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proxies</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.active}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {Math.round((stats.summary.active / stats.summary.total) * 100)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Proxies</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.failed}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {stats.summary.blacklisted} blacklisted
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.successRate}%</div>
            <div className="text-xs text-muted-foreground mt-2">
              Overall performance
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.byProvider.map((item) => (
              <div key={item.provider} className="flex items-center justify-between">
                <span className="text-sm">{item.provider}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.byType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm capitalize">{item.type}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By Country</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.byCountry.slice(0, 5).map((item) => (
              <div key={item.country} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  <span className="text-sm">{item.country || 'Unknown'}</span>
                </div>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
            {stats.byCountry.length > 5 && (
              <p className="text-xs text-muted-foreground mt-2">
                +{stats.byCountry.length - 5} more countries
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}