const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface Job {
  id: string
  url: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  projectId: string
  project?: {
    id: string
    name: string
  }
  result?: {
    html?: string
    error?: string
    statusCode?: number
    finalUrl?: string
    contentType?: string
    executionTime?: number
  }
}

export interface Project {
  id: string
  name: string
  description?: string
  jobCount?: number
  createdAt: string
}

export interface DashboardStats {
  totalJobs: number
  completedJobs: number
  failedJobs: number
  activeProxies: number
  successRate: number
  averageExecutionTime: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/stats')
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard statistics')
  }
  
  return response.json()
}

export async function getRecentJobs(limit = 5): Promise<Job[]> {
  const response = await fetch(`/api/jobs?limit=${limit}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch recent jobs')
  }
  
  const data = await response.json()
  return data.jobs
}

export async function getJobs(page = 1, limit = 20, status?: string): Promise<{ jobs: Job[]; total: number; totalPages: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  if (status && status !== 'all') {
    params.append('status', status)
  }
  
  const response = await fetch(`/api/jobs?${params}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch jobs')
  }
  
  const data = await response.json()
  return {
    jobs: data.jobs,
    total: data.total,
    totalPages: data.totalPages,
  }
}

export async function getJob(id: string): Promise<Job | null> {
  const response = await fetch(`/api/jobs/${id}`)
  
  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error('Failed to fetch job')
  }
  
  return response.json()
}

export async function createJob(data: {
  url: string
  projectId: string
  options?: {
    useProxy?: boolean
    timeout?: number
    headers?: Record<string, string>
  }
}): Promise<{ jobId: string; status: string; timestamp: string }> {
  console.log('Creating job with data:', data)
  
  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  console.log('Response status:', response.status)
  
  if (!response.ok) {
    let errorMessage = 'Failed to create job'
    try {
      const errorText = await response.text()
      console.error('API error response text:', errorText)
      if (errorText) {
        try {
          const error = JSON.parse(errorText)
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = errorText
        }
      }
    } catch (e) {
      console.error('Error parsing response:', e)
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch('/api/projects')
  
  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }
  
  const projects = await response.json()
  
  // Transform the response to match our interface
  return projects.map((project: any) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    jobCount: project._count?.jobs || 0,
    createdAt: project.createdAt,
  }))
}