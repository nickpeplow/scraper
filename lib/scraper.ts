import axios, { AxiosError } from 'axios'
import { prisma } from './db'
import { Proxy } from '@prisma/client'

interface ScrapeOptions {
  url: string
  useProxy: boolean
  headers?: Record<string, string>
  timeout?: number
  proxy?: Proxy
}

interface ScrapeResult {
  html: string
  statusCode: number
  headers: Record<string, string>
  finalUrl: string
  contentType: string
  redirectCount: number
  serverIp?: string
  executionTime: number
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
]

export async function scrapeUrl(options: ScrapeOptions): Promise<ScrapeResult> {
  const startTime = Date.now()

  interface AxiosConfig {
    timeout: number
    maxRedirects: number
    validateStatus: (status: number) => boolean
    headers: Record<string, string>
    proxy?: {
      host: string
      port: number
      auth?: {
        username: string
        password: string
      }
      protocol: string
    }
  }

  const axiosConfig: AxiosConfig = {
    timeout: options.timeout || 30000,
    maxRedirects: 5,
    validateStatus: (status: number) => status < 500,
    headers: {
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      ...options.headers,
    },
  }

  // Configure proxy if provided
  if (options.useProxy && options.proxy) {
    axiosConfig.proxy = {
      host: options.proxy.host,
      port: options.proxy.port,
      auth:
        options.proxy.username && options.proxy.password
          ? {
              username: options.proxy.username,
              password: options.proxy.password,
            }
          : undefined,
      protocol: options.proxy.protocol,
    }
  }

  try {
    const response = await axios.get(options.url, axiosConfig)

    const executionTime = Date.now() - startTime

    // Convert response data to string if it's JSON
    let htmlContent = response.data
    if (typeof response.data === 'object') {
      htmlContent = JSON.stringify(response.data, null, 2)
    }

    return {
      html: htmlContent,
      statusCode: response.status,
      headers: response.headers as Record<string, string>,
      finalUrl: response.request.res.responseUrl || options.url,
      contentType: response.headers['content-type'] || 'text/html',
      redirectCount: response.request._redirectable?._redirectCount || 0,
      serverIp: response.request.socket?.remoteAddress,
      executionTime,
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Scraping failed: ${error.message}`)
    }
    throw error
  }
}

export async function getRandomProxy(): Promise<Proxy | null> {
  return await prisma.proxy.findFirst({
    where: {
      status: 'active',
      deletedAt: null,
    },
    orderBy: [{ failureCount: 'asc' }, { lastUsedAt: 'asc' }],
  })
}
