import { Worker, Job } from 'bullmq'
import { prisma } from './lib/db'
import redis from './lib/redis'
import { scrapeUrl, getRandomProxy } from './lib/scraper'
import { ScrapeJobData } from './lib/queue'
import { logger } from './lib/logger'
import { publishJobEvent } from './lib/events/job-events'

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
  username: redis.options.username,
}

async function updateJobStatus(
  jobId: string,
  fromStatus: string,
  toStatus: string,
  details?: Record<string, unknown>
) {
  // Get job details for event publishing
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { userId: true, projectId: true }
  })
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }

  await prisma.$transaction([
    prisma.job.update({
      where: { id: jobId },
      data: {
        status: toStatus,
        startedAt: toStatus === 'running' ? new Date() : undefined,
        completedAt: ['completed', 'failed'].includes(toStatus) ? new Date() : undefined,
      },
    }),
    prisma.jobEvent.create({
      data: {
        jobId,
        fromStatus,
        toStatus,
        details: details ? JSON.parse(JSON.stringify(details)) : {},
      },
    }),
  ])
  
  // Publish real-time event
  await publishJobEvent({
    type: toStatus === 'completed' ? 'job:completed' : 
          toStatus === 'failed' ? 'job:failed' : 
          'job:status_changed',
    jobId,
    userId: job.userId,
    projectId: job.projectId,
    data: {
      status: toStatus,
      timestamp: new Date().toISOString(),
      ...details
    }
  })
}

const scraperWorker = new Worker<ScrapeJobData>(
  'scraper-jobs',
  async (job: Job<ScrapeJobData>) => {
    const { jobId, url, useProxy, headers, timeout } = job.data

    logger.info(`Processing job ${jobId} for URL: ${url}`)

    try {
      // Update job status to running
      await updateJobStatus(jobId, 'pending', 'running')

      // Get proxy if needed
      let proxy = null
      if (useProxy) {
        proxy = await getRandomProxy()
        if (proxy) {
          await prisma.proxy.update({
            where: { id: proxy.id },
            data: { lastUsedAt: new Date() },
          })
        }
      }

      // Perform the scrape
      const result = await scrapeUrl({
        url,
        useProxy,
        headers,
        timeout,
        proxy: proxy || undefined,
      })

      // Store the result
      await prisma.jobResult.create({
        data: {
          jobId,
          scrapedData: result.html,
          responseStatusCode: result.statusCode,
          responseHeaders: result.headers,
          executionTimeMs: result.executionTime,
          dataSizeBytes: Buffer.byteLength(result.html, 'utf8'),
          proxyId: proxy?.id,
          finalUrl: result.finalUrl,
          contentType: result.contentType,
          redirectCount: result.redirectCount,
          serverIp: result.serverIp,
        },
      })

      // Update proxy success count
      if (proxy) {
        await prisma.proxy.update({
          where: { id: proxy.id },
          data: { successCount: { increment: 1 } },
        })
      }

      // Update job status to completed
      await updateJobStatus(jobId, 'running', 'completed', {
        executionTime: result.executionTime,
        statusCode: result.statusCode,
      })

      logger.info(`Job ${jobId} completed successfully`)
    } catch (error) {
      logger.error(`Job ${jobId} failed:`, error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Store error result
      await prisma.jobResult.create({
        data: {
          jobId,
          errorMessage,
          errorType: 'SCRAPE_ERROR',
        },
      })

      // Update job status to failed
      await updateJobStatus(jobId, 'running', 'failed', {
        error: errorMessage,
      })

      throw error // This will trigger BullMQ retry logic
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.MAX_CONCURRENT_WORKERS || '5'),
  }
)

scraperWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`)
})

scraperWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err)
})

logger.info('Scraper worker started...')

// Send heartbeat if managed by worker-manager
if (process.env.WORKER_MANAGED === 'true') {
  const heartbeatInterval = setInterval(async () => {
    try {
      await redis.set('worker:heartbeat', new Date().toISOString(), 'EX', 60)
    } catch (error) {
      logger.error('Failed to send heartbeat:', error)
    }
  }, 30000) // Every 30 seconds

  // Clean up on exit
  process.on('SIGTERM', () => {
    clearInterval(heartbeatInterval)
  })
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker...')
  await scraperWorker.close()
  await redis.disconnect()
  process.exit(0)
})
