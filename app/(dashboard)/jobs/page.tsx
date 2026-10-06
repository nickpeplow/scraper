'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { JobsList } from '@/components/jobs/jobs-list'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getJobs } from '@/lib/api-client'
import type { Job } from '@/lib/api-client'
import { useRealtimeJobs } from '@/lib/hooks/use-realtime-jobs'

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const searchParams = useSearchParams()

  useEffect(() => {
    const pageParam = searchParams.get('page')
    if (pageParam) {
      setPage(parseInt(pageParam))
    }
  }, [searchParams])

  // Load jobs function
  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getJobs(page, 20)
      setJobs(result.jobs)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [page])

  // Set up real-time updates
  const { isConnected } = useRealtimeJobs({
    onJobUpdate: useCallback((jobId, status) => {
      // Update job status in the list
      setJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { ...job, status } : job
        )
      )
    }, []),
    onJobComplete: useCallback((jobId) => {
      // Update the specific job and potentially reload if on first page
      setJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { ...job, status: 'completed', completedAt: new Date().toISOString() } : job
        )
      )
    }, []),
    onJobFailed: useCallback((jobId) => {
      // Update the specific job
      setJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { ...job, status: 'failed' } : job
        )
      )
    }, []),
  })

  // Load jobs when page changes
  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // Update URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.set('page', newPage.toString())
    window.history.pushState({}, '', url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Manage and monitor your scraping jobs
            </p>
            {isConnected && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                Live updates
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

      <div className="space-y-0">
        <JobsList
          jobs={jobs}
          loading={loading}
          showProject={true}
          showTabs={true}
          showSearch={true}
          title="All Jobs"
        />
        
        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <Card className="rounded-t-none border-t-0">
            <div className="flex items-center justify-between px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} jobs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    
                    return (
                      <Button
                        key={i}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}