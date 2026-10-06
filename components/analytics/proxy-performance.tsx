'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProxyPerformanceProps {
  data: {
    provider: string
    proxy_type: string
    total_requests: number
    successful_requests: number
    avg_execution_time: number
  }[]
}

export function ProxyPerformance({ data }: ProxyPerformanceProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No proxy data available</p>
      </div>
    )
  }

  const formattedData = data.map(item => ({
    ...item,
    successRate: item.total_requests > 0 
      ? Math.round((item.successful_requests / item.total_requests) * 100)
      : 0,
  }))

  const getPerformanceBadge = (successRate: number) => {
    if (successRate >= 90) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Excellent</Badge>
    } else if (successRate >= 70) {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Good</Badge>
    } else if (successRate >= 50) {
      return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Fair</Badge>
    } else {
      return <Badge variant="destructive">Poor</Badge>
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Total Requests</TableHead>
          <TableHead className="text-right">Success Rate</TableHead>
          <TableHead className="text-right">Avg. Response Time</TableHead>
          <TableHead>Performance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {formattedData.map((item, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">
              {item.provider || 'Direct Connection'}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {item.proxy_type || 'None'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {item.total_requests.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              <span className="font-medium">{item.successRate}%</span>
              <span className="text-xs text-muted-foreground ml-1">
                ({item.successful_requests.toLocaleString()}/{item.total_requests.toLocaleString()})
              </span>
            </TableCell>
            <TableCell className="text-right">
              {item.avg_execution_time 
                ? `${(item.avg_execution_time / 1000).toFixed(2)}s`
                : '-'
              }
            </TableCell>
            <TableCell>
              {getPerformanceBadge(item.successRate)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}