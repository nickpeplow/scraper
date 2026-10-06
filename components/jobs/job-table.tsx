'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressIndicator, TimeElapsed } from '@/components/ui/progress-indicator'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, RefreshCw } from 'lucide-react'
import type { Job } from '@/lib/api-client'

interface JobTableProps {
  jobs: Job[]
  loading?: boolean
  showProject?: boolean
  emptyMessage?: string
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
}

export function JobTable({ jobs, loading, showProject = false, emptyMessage = "No jobs found" }: JobTableProps) {
  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-[300px]" />
              </TableCell>
              {showProject && (
                <TableCell>
                  <Skeleton className="h-4 w-[120px]" />
                </TableCell>
              )}
              <TableCell>
                <Skeleton className="h-5 w-[80px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[60px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-[80px] ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>URL</TableHead>
          {showProject && <TableHead>Project</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => {
          const duration = job.completedAt
            ? new Date(job.completedAt).getTime() -
              new Date(job.createdAt).getTime()
            : null

          return (
            <TableRow key={job.id}>
              <TableCell>
                <div className="flex items-center gap-2 max-w-[400px]">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 truncate"
                  >
                    {job.url}
                  </Link>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </TableCell>
              {showProject && (
                <TableCell>
                  {job.project ? (
                    <Link
                      href={`/projects/${job.projectId}`}
                      className="text-sm hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {job.project.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <ProgressIndicator status={job.status} size="sm" />
                  <Badge className={statusColors[job.status]}>
                    {job.status}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(job.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {job.status === 'running' ? (
                  <TimeElapsed startTime={job.createdAt} />
                ) : duration ? (
                  `${(duration / 1000).toFixed(1)}s`
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {job.status === 'failed' && (
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                  <Link href={`/jobs/${job.id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}