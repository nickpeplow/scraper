import { Queue } from 'bullmq'
import redis from './redis'

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
  username: redis.options.username,
}

export const scraperQueue = new Queue('scraper-jobs', {
  connection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 100,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

export type ScrapeJobData = {
  jobId: string
  url: string
  useProxy: boolean
  headers?: Record<string, string>
  timeout?: number
}
