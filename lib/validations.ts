import { z } from 'zod'

export const createScrapeJobSchema = z.object({
  url: z.string().url('Invalid URL format'),
  projectId: z.string().min(1, 'Project ID is required'),
  options: z
    .object({
      timeout: z.number().min(1000).max(60000).default(30000).optional(),
      useProxy: z.boolean().default(true).optional(),
      headers: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
})

export type CreateScrapeJobInput = z.infer<typeof createScrapeJobSchema>

export const jobStatusSchema = z.enum(['pending', 'running', 'completed', 'failed'])

export type JobStatus = z.infer<typeof jobStatusSchema>
