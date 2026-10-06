'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressIndicator, AnimatedProgressBar, TimeElapsed } from '@/components/ui/progress-indicator'
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Copy, 
  Download,
  ExternalLink,
  Globe,
  Server,
  Timer,
  FileCode
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRealtimeJobs, useJobPolling } from '@/lib/hooks/use-realtime-jobs'

interface JobDetails {
  id: string
  url: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  result?: {
    html?: string
    statusCode?: number
    contentType?: string
    finalUrl?: string
    executionTime?: number
    proxyUsed?: string
    error?: string
  }
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [jobId, setJobId] = useState<string>('')
  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    params.then(p => setJobId(p.id))
  }, [params])

  // Fetch job initially
  const fetchJob = useCallback(async () => {
    if (!jobId) return
    
    try {
      const response = await fetch(`/api/scrape/${jobId}/status`)
      if (!response.ok) {
        throw new Error('Failed to fetch job details')
      }
      const data = await response.json()
      setJob(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  // Set up real-time updates
  const { getJobUpdate } = useRealtimeJobs({
    onJobUpdate: useCallback((id, status) => {
      if (id === jobId) {
        setJob(prev => prev ? { ...prev, status } : prev)
      }
    }, [jobId]),
    onJobComplete: useCallback((id) => {
      if (id === jobId) {
        // Reload full job details when completed
        fetchJob()
      }
    }, [jobId, fetchJob]),
    onJobFailed: useCallback((id, error) => {
      if (id === jobId) {
        setJob(prev => prev ? { 
          ...prev, 
          status: 'failed',
          result: { ...prev.result, error }
        } : prev)
      }
    }, [jobId]),
  })

  // Initial fetch
  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!job?.result?.html) return
    
    const blob = new Blob([job.result.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scrape-${job.id}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Job not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <ProgressIndicator status={job.status} size="lg" />
            <h1 className="text-2xl font-bold">Job Details</h1>
          </div>
        </div>
        {getStatusBadge(job.status)}
      </div>

      {/* Job Information Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>URL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a 
                href={job.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline truncate"
              >
                {job.url}
              </a>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Status Code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {job.result?.statusCode || '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Execution Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {job.result?.executionTime ? `${job.result.executionTime}ms` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Result Content */}
      {job.status === 'completed' && job.result ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Result</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(job.result?.html || '')}
                  disabled={!job.result?.html}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy HTML'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!job.result?.html}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="source">Source</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4">
                {job.result.html ? (
                  <div className="border rounded-lg p-4 bg-white">
                    <iframe
                      srcDoc={job.result.html}
                      className="w-full h-96 border-0"
                      title="Scraped content preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <Alert>
                    <FileCode className="h-4 w-4" />
                    <AlertTitle>No HTML content</AlertTitle>
                    <AlertDescription>
                      The scraping job completed but no HTML was returned.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              
              <TabsContent value="source" className="mt-4">
                {job.result.html ? (
                  <div className="relative">
                    <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                      <code>{job.result.html}</code>
                    </pre>
                  </div>
                ) : (
                  <Alert>
                    <FileCode className="h-4 w-4" />
                    <AlertTitle>No HTML content</AlertTitle>
                    <AlertDescription>
                      The scraping job completed but no HTML was returned.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>

            {/* Metadata */}
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-medium">Metadata</h4>
              <div className="grid gap-2 text-sm">
                {job.result.finalUrl && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Final URL:</span>
                    <span className="font-mono">{job.result.finalUrl}</span>
                  </div>
                )}
                {job.result.contentType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Content Type:</span>
                    <span className="font-mono">{job.result.contentType}</span>
                  </div>
                )}
                {job.result.proxyUsed && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proxy Used:</span>
                    <span className="font-mono text-xs">{job.result.proxyUsed}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : job.status === 'failed' && job.result?.error ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Job Failed</AlertTitle>
          <AlertDescription>{job.result.error}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            {job.status === 'running' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <div>
                    <p className="text-lg font-medium">Scraping in progress...</p>
                    <p className="text-sm text-muted-foreground">
                      This page will update automatically when the job completes.
                    </p>
                  </div>
                </div>
                <AnimatedProgressBar indeterminate className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Elapsed: <TimeElapsed startTime={job.createdAt} /></span>
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                    Live updates enabled
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-lg font-medium">Job is pending</p>
                  <p className="text-sm text-muted-foreground">
                    Waiting for an available worker to process this job.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}