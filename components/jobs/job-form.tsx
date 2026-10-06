'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createScrapeJobSchema, type CreateScrapeJobInput } from '@/lib/validations'
import { createJob, getProjects } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ProjectSelector } from './project-selector'
import { HeadersInput } from './headers-input'
import { ChevronDown, Loader2, AlertCircle, FolderOpen } from 'lucide-react'

interface JobFormProps {
  defaultProjectId?: string | null
}

export function JobForm({ defaultProjectId }: JobFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [projectName, setProjectName] = useState<string | null>(null)

  const form = useForm<CreateScrapeJobInput>({
    resolver: zodResolver(createScrapeJobSchema),
    defaultValues: {
      url: '',
      projectId: defaultProjectId || '', // Use default project if provided
      options: {
        useProxy: true,
        timeout: 30000,
        headers: {},
      },
    },
  })

  // Fetch project name when default project is provided
  useEffect(() => {
    if (defaultProjectId) {
      getProjects().then(projects => {
        const project = projects.find(p => p.id === defaultProjectId)
        if (project) {
          setProjectName(project.name)
        }
      }).catch(err => {
        console.error('Failed to fetch project:', err)
      })
    }
  }, [defaultProjectId])

  const onSubmit = async (data: CreateScrapeJobInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      console.log('Submitting job with data:', data)
      const result = await createJob({
        url: data.url,
        projectId: data.projectId,
        options: data.options,
      })

      console.log('Job created successfully:', result)
      // Redirect to job details page
      router.push(`/jobs/${result.jobId}`)
    } catch (err) {
      console.error('Error creating job:', err)
      setError(err instanceof Error ? err.message : 'Failed to create job')
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Scraping Job</CardTitle>
        <CardDescription>
          Enter the URL you want to scrape and configure the job settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {defaultProjectId && projectName ? (
              <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/50">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Project:</span>
                <Badge variant="secondary">{projectName}</Badge>
              </div>
            ) : !defaultProjectId && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <ProjectSelector
                      value={field.value}
                      onValueChange={field.onChange}
                      error={form.formState.errors.projectId?.message}
                    />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      className={form.formState.errors.url ? 'border-red-500' : ''}
                    />
                  </FormControl>
                  <FormDescription>
                    The URL you want to scrape
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Collapsible
              open={isAdvancedOpen}
              onOpenChange={setIsAdvancedOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  Advanced Options
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isAdvancedOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6 pt-6">
                <FormField
                  control={form.control}
                  name="options.useProxy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use Proxy</FormLabel>
                        <FormDescription>
                          Route request through a proxy server
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="options.timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Timeout: {((field.value || 30000) / 1000).toFixed(0)}s
                      </FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value || 30000]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={1000}
                          max={60000}
                          step={1000}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum time to wait for response (1-60 seconds)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="options.headers"
                  render={({ field }) => (
                    <FormItem>
                      <HeadersInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Job...
                  </>
                ) : (
                  'Create Job'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}