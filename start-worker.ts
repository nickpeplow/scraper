#!/usr/bin/env npx tsx

import redis from './lib/redis'
import { logger } from './lib/logger'
import { spawn } from 'child_process'

const WORKER_LOCK = 'worker:lock'
const LOCK_TTL = 60 // 60 seconds

async function acquireLock(): Promise<boolean> {
  const result = await redis.set(WORKER_LOCK, process.pid.toString(), 'EX', LOCK_TTL, 'NX')
  return result === 'OK'
}

async function releaseLock() {
  await redis.del(WORKER_LOCK)
}

async function keepLockAlive() {
  setInterval(async () => {
    const currentLock = await redis.get(WORKER_LOCK)
    if (currentLock === process.pid.toString()) {
      await redis.expire(WORKER_LOCK, LOCK_TTL)
    }
  }, 30000) // Refresh every 30 seconds
}

async function main() {
  // Try to acquire lock
  const lockAcquired = await acquireLock()
  
  if (!lockAcquired) {
    const existingPid = await redis.get(WORKER_LOCK)
    logger.error(`Another worker is already running (PID: ${existingPid}). Only one worker instance is allowed.`)
    process.exit(1)
  }

  logger.info(`Worker lock acquired (PID: ${process.pid})`)
  
  // Keep lock alive
  keepLockAlive()

  // Set up cleanup handlers
  const cleanup = async () => {
    logger.info('Cleaning up worker lock...')
    await releaseLock()
    process.exit(0)
  }

  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
  process.on('exit', () => {
    releaseLock()
  })

  // Import and run the worker
  try {
    require('./worker')
  } catch (error) {
    logger.error('Worker failed:', error)
    await cleanup()
  }
}

main().catch(async (error) => {
  logger.error('Failed to start worker:', error)
  await releaseLock()
  process.exit(1)
})