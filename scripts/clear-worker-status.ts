#!/usr/bin/env tsx

import Redis from 'ioredis'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

async function clearWorkerStatus() {
  try {
    // Clear all worker-related keys
    await redis.del('worker:status')
    await redis.del('worker:lock')
    await redis.del('worker:heartbeat')
    
    console.log('Worker status cleared from Redis')
  } catch (error) {
    console.error('Error clearing worker status:', error)
  } finally {
    await redis.quit()
  }
}

clearWorkerStatus()