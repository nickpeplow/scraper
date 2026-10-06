import redis from '@/lib/redis'

export interface JobEvent {
  type: 'job:status_changed' | 'job:progress' | 'job:completed' | 'job:failed'
  jobId: string
  userId: string
  projectId: string
  data: {
    status?: string
    progress?: number
    result?: any
    error?: string
    timestamp: string
  }
}

const CHANNEL_PREFIX = 'job-events:'

export async function publishJobEvent(event: JobEvent) {
  const channel = `${CHANNEL_PREFIX}${event.userId}`
  await redis.publish(channel, JSON.stringify(event))
  
  // Also publish to a project-specific channel
  const projectChannel = `${CHANNEL_PREFIX}project:${event.projectId}`
  await redis.publish(projectChannel, JSON.stringify(event))
}

export async function subscribeToJobEvents(userId: string, callback: (event: JobEvent) => void) {
  const subscriber = redis.duplicate()
  await subscriber.connect()
  
  const channel = `${CHANNEL_PREFIX}${userId}`
  
  await subscriber.subscribe(channel, (message) => {
    try {
      const event = JSON.parse(message) as JobEvent
      callback(event)
    } catch (error) {
      console.error('Error parsing job event:', error)
    }
  })
  
  return () => {
    subscriber.unsubscribe(channel)
    subscriber.disconnect()
  }
}

export async function subscribeToProjectEvents(projectId: string, callback: (event: JobEvent) => void) {
  const subscriber = redis.duplicate()
  await subscriber.connect()
  
  const channel = `${CHANNEL_PREFIX}project:${projectId}`
  
  await subscriber.subscribe(channel, (message) => {
    try {
      const event = JSON.parse(message) as JobEvent
      callback(event)
    } catch (error) {
      console.error('Error parsing job event:', error)
    }
  })
  
  return () => {
    subscriber.unsubscribe(channel)
    subscriber.disconnect()
  }
}