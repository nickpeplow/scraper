'use client'

import { JobForm } from '@/components/jobs/job-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function NewJobPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={projectId ? `/projects/${projectId}` : "/jobs"}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {projectId ? 'Project' : 'Jobs'}
        </Link>
      </div>
      
      <JobForm defaultProjectId={projectId} />
    </div>
  )
}