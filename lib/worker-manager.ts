import redis from '@/lib/redis'
import { spawn, ChildProcess } from 'child_process'
import { logger } from './logger'

const WORKER_KEY = 'worker:status'
const WORKER_LOCK = 'worker:lock'
const LOCK_TTL = 60 // 60 seconds

export interface WorkerStatus {
  status: 'running' | 'stopped' | 'starting' | 'stopping'
  pid?: number
  startedAt?: string
  stoppedAt?: string
  lastHeartbeat?: string
}

let workerProcess: ChildProcess | null = null

export async function getWorkerStatus(): Promise<WorkerStatus> {
  const status = await redis.get(WORKER_KEY)
  if (!status) {
    return { status: 'stopped' }
  }
  return JSON.parse(status)
}

export async function updateWorkerStatus(status: Partial<WorkerStatus>) {
  const current = await getWorkerStatus()
  const updated = {
    ...current,
    ...status,
    lastHeartbeat: new Date().toISOString()
  }
  await redis.set(WORKER_KEY, JSON.stringify(updated))
  return updated
}

export async function startWorker(): Promise<{ success: boolean; message: string }> {
  try {
    // Try to acquire lock
    const lockAcquired = await redis.set(WORKER_LOCK, '1', 'EX', LOCK_TTL, 'NX')
    if (!lockAcquired) {
      const status = await getWorkerStatus()
      if (status.status === 'running' || status.status === 'starting') {
        return { success: false, message: 'Worker is already running' }
      }
    }

    // Update status to starting
    await updateWorkerStatus({ status: 'starting' })

    // Spawn worker process
    workerProcess = spawn('npx', ['tsx', 'worker.ts'], {
      detached: false,
      stdio: 'pipe',
      env: { ...process.env, WORKER_MANAGED: 'true' }
    })

    if (!workerProcess.pid) {
      await updateWorkerStatus({ status: 'stopped' })
      return { success: false, message: 'Failed to start worker process' }
    }

    // Update status to running
    await updateWorkerStatus({
      status: 'running',
      pid: workerProcess.pid,
      startedAt: new Date().toISOString()
    })

    // Handle worker output
    workerProcess.stdout?.on('data', (data) => {
      logger.info(`Worker: ${data.toString().trim()}`)
    })

    workerProcess.stderr?.on('data', (data) => {
      logger.error(`Worker Error: ${data.toString().trim()}`)
    })

    // Handle worker exit
    workerProcess.on('exit', async (code, signal) => {
      logger.info(`Worker exited with code ${code} and signal ${signal}`)
      await updateWorkerStatus({
        status: 'stopped',
        stoppedAt: new Date().toISOString(),
        pid: undefined
      })
      workerProcess = null
      
      // Release lock
      await redis.del(WORKER_LOCK)
    })

    // Keep lock alive
    const lockInterval = setInterval(async () => {
      const status = await getWorkerStatus()
      if (status.status === 'running') {
        await redis.expire(WORKER_LOCK, LOCK_TTL)
      } else {
        clearInterval(lockInterval)
      }
    }, 30000) // Refresh every 30 seconds

    return { success: true, message: 'Worker started successfully' }
  } catch (error) {
    logger.error('Failed to start worker:', error)
    await updateWorkerStatus({ status: 'stopped' })
    await redis.del(WORKER_LOCK)
    return { success: false, message: 'Failed to start worker' }
  }
}

export async function stopWorker(): Promise<{ success: boolean; message: string }> {
  try {
    const status = await getWorkerStatus()
    
    if (status.status !== 'running') {
      return { success: false, message: 'Worker is not running' }
    }

    // Update status to stopping
    await updateWorkerStatus({ status: 'stopping' })

    if (workerProcess && !workerProcess.killed) {
      // Send SIGTERM for graceful shutdown
      workerProcess.kill('SIGTERM')
      
      // Wait for process to exit (with timeout)
      await new Promise<void>((resolve) => {
        let timeout: NodeJS.Timeout
        
        const cleanup = () => {
          clearTimeout(timeout)
          resolve()
        }
        
        workerProcess!.once('exit', cleanup)
        
        // Force kill after 10 seconds
        timeout = setTimeout(() => {
          if (workerProcess && !workerProcess.killed) {
            logger.warn('Worker did not exit gracefully, forcing kill')
            workerProcess.kill('SIGKILL')
          }
          cleanup()
        }, 10000)
      })
    }

    // Update status
    await updateWorkerStatus({
      status: 'stopped',
      stoppedAt: new Date().toISOString(),
      pid: undefined
    })

    // Release lock
    await redis.del(WORKER_LOCK)

    return { success: true, message: 'Worker stopped successfully' }
  } catch (error) {
    logger.error('Failed to stop worker:', error)
    return { success: false, message: 'Failed to stop worker' }
  }
}

// Check if worker is actually running by checking process
export async function checkWorkerHealth(): Promise<boolean> {
  const status = await getWorkerStatus()
  
  if (status.status !== 'running' || !status.pid) {
    return false
  }

  // Check if process is actually running
  try {
    process.kill(status.pid, 0)
    return true
  } catch {
    // Process doesn't exist, update status
    await updateWorkerStatus({
      status: 'stopped',
      pid: undefined
    })
    await redis.del(WORKER_LOCK)
    return false
  }
}

// Force quit all worker processes
export async function forceQuitWorkers(): Promise<{ success: boolean; message: string; killed: number[] }> {
  try {
    const killedPids: number[] = []
    
    // Get current worker status
    const status = await getWorkerStatus()
    
    // Kill managed worker if running
    if (status.pid) {
      try {
        process.kill(status.pid, 'SIGKILL')
        killedPids.push(status.pid)
      } catch (error) {
        logger.warn(`Failed to kill process ${status.pid}:`, error)
      }
    }
    
    // Find all node processes running worker.ts
    const { exec } = require('child_process')
    const findWorkersCmd = process.platform === 'win32' 
      ? 'wmic process where "commandline like \'%worker.ts%\' and name=\'node.exe\'" get processid'
      : 'ps aux | grep "[n]ode.*worker\\.ts" | awk \'{print $2}\''
    
    await new Promise<void>((resolve) => {
      exec(findWorkersCmd, async (error: any, stdout: string) => {
        if (error) {
          logger.error('Error finding worker processes:', error)
          resolve()
          return
        }
        
        const pids = stdout
          .split('\n')
          .map(line => line.trim())
          .filter(line => /^\d+$/.test(line))
          .map(pid => parseInt(pid))
        
        for (const pid of pids) {
          try {
            process.kill(pid, 'SIGKILL')
            killedPids.push(pid)
            logger.info(`Force killed worker process: ${pid}`)
          } catch (err) {
            // Process might have already exited
            logger.warn(`Failed to kill process ${pid}:`, err)
          }
        }
        
        resolve()
      })
    })
    
    // Clean up Redis state
    await updateWorkerStatus({
      status: 'stopped',
      stoppedAt: new Date().toISOString(),
      pid: undefined
    })
    await redis.del(WORKER_LOCK)
    await redis.del('worker:heartbeat')
    
    // Kill local worker process reference if exists
    if (workerProcess && !workerProcess.killed) {
      workerProcess.kill('SIGKILL')
    }
    workerProcess = null
    
    return {
      success: true,
      message: `Force quit ${killedPids.length} worker process(es)`,
      killed: killedPids
    }
  } catch (error) {
    logger.error('Failed to force quit workers:', error)
    return {
      success: false,
      message: 'Failed to force quit workers',
      killed: []
    }
  }
}