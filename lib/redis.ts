import Redis from 'ioredis'
import { logger } from './logger'

const redis = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: 3,
})

redis.on('error', (error) => {
  logger.error('Redis Client Error:', error)
})

redis.on('connect', () => {
  logger.info('Redis Client Connected')
})

export default redis
export { redis }
