'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { JobTable } from './job-table'
import { Search } from 'lucide-react'
import type { Job } from '@/lib/api-client'

interface JobsListProps {
  jobs: Job[]
  loading?: boolean
  showProject?: boolean
  showTabs?: boolean
  showSearch?: boolean
  title?: string
  description?: string
  emptyMessage?: string
}

export function JobsList({
  jobs,
  loading = false,
  showProject = true,
  showTabs = true,
  showSearch = true,
  title,
  description,
  emptyMessage = "No jobs found"
}: JobsListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'running' | 'completed' | 'failed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate status counts
  const statusCounts = useMemo(() => ({
    all: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  }), [jobs])

  // Filter jobs by status and search query
  const filteredJobs = useMemo(() => {
    let filtered = jobs

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(job => job.status === filter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(job => 
        job.url.toLowerCase().includes(query) ||
        (job.project?.name && job.project.name.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [jobs, filter, searchQuery])

  const content = showTabs ? (
    <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
      <div className="space-y-4">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by URL or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 gap-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <div className="flex flex-col items-center py-1">
              <span className="text-sm font-medium">All</span>
              <span className="text-xs text-muted-foreground">{statusCounts.all}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <div className="flex flex-col items-center py-1">
              <span className="text-sm font-medium">Pending</span>
              <span className="text-xs text-muted-foreground">{statusCounts.pending}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="running" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <div className="flex flex-col items-center py-1">
              <span className="text-sm font-medium">Running</span>
              <span className="text-xs text-muted-foreground">{statusCounts.running}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <div className="flex flex-col items-center py-1">
              <span className="text-sm font-medium">Completed</span>
              <span className="text-xs text-muted-foreground">{statusCounts.completed}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="failed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <div className="flex flex-col items-center py-1">
              <span className="text-sm font-medium">Failed</span>
              <span className="text-xs text-muted-foreground">{statusCounts.failed}</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value={filter} className="mt-6">
        <JobTable 
          jobs={filteredJobs} 
          loading={loading} 
          showProject={showProject}
          emptyMessage={
            searchQuery 
              ? `No jobs found matching "${searchQuery}"` 
              : emptyMessage
          }
        />
      </TabsContent>
    </Tabs>
  ) : (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      
      <JobTable 
        jobs={filteredJobs} 
        loading={loading} 
        showProject={showProject}
        emptyMessage={
          searchQuery 
            ? `No jobs found matching "${searchQuery}"` 
            : emptyMessage
        }
      />
    </div>
  )

  if (!title) {
    return content
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="pb-0">
        {content}
      </CardContent>
    </Card>
  )
}