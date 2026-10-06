#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixStuckJobs() {
  try {
    // Find all jobs that are stuck in 'running' state
    const stuckJobs = await prisma.job.findMany({
      where: {
        status: 'running',
        // Consider jobs stuck if they've been running for more than 30 minutes
        startedAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000)
        }
      }
    })

    console.log(`Found ${stuckJobs.length} stuck jobs`)

    for (const job of stuckJobs) {
      console.log(`Fixing job ${job.id} - URL: ${job.url}`)
      
      // Update the job status to failed
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          completedAt: new Date()
        }
      })

      // Create or update job result with the error
      await prisma.jobResult.upsert({
        where: { jobId: job.id },
        create: {
          jobId: job.id,
          errorMessage: 'Job was stuck in running state and has been marked as failed',
          errorType: 'STUCK_JOB',
          executionTimeMs: job.startedAt ? Date.now() - job.startedAt.getTime() : 0
        },
        update: {
          errorMessage: 'Job was stuck in running state and has been marked as failed',
          errorType: 'STUCK_JOB'
        }
      })
      
      console.log(`Updated job ${job.id} to failed status`)
    }

    // Also check for any jobs that are pending for too long
    const stuckPendingJobs = await prisma.job.findMany({
      where: {
        status: 'pending',
        // Consider jobs stuck if they've been pending for more than 1 hour
        createdAt: {
          lt: new Date(Date.now() - 60 * 60 * 1000)
        }
      }
    })

    console.log(`Found ${stuckPendingJobs.length} stuck pending jobs`)

    for (const job of stuckPendingJobs) {
      console.log(`Fixing pending job ${job.id} - URL: ${job.url}`)
      
      // Update the job status to failed
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          completedAt: new Date()
        }
      })

      // Create or update job result with the error
      await prisma.jobResult.upsert({
        where: { jobId: job.id },
        create: {
          jobId: job.id,
          errorMessage: 'Job was stuck in pending state and has been marked as failed',
          errorType: 'STUCK_JOB',
          executionTimeMs: 0
        },
        update: {
          errorMessage: 'Job was stuck in pending state and has been marked as failed',
          errorType: 'STUCK_JOB'
        }
      })
      
      console.log(`Updated job ${job.id} to failed status`)
    }

    console.log('All stuck jobs have been fixed')
  } catch (error) {
    console.error('Error fixing stuck jobs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixStuckJobs()