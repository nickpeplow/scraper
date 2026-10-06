'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Copy, CheckCircle2, XCircle, Loader2, Code2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TestResult {
  status: 'success' | 'error' | 'pending'
  statusCode?: number
  response?: any
  error?: string
  duration?: number
}

interface ApiTest {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  headers?: Record<string, string>
  body?: any
  description: string
}

interface TestUrl {
  url: string
  name: string
  description: string
}

const TEST_URLS: TestUrl[] = [
  {
    url: 'https://httpbin.org/ip',
    name: 'IP Address Check',
    description: 'Returns your IP address in JSON format'
  },
  {
    url: 'https://httpbin.org/user-agent',
    name: 'User Agent Check',
    description: 'Returns the User-Agent header'
  },
  {
    url: 'https://httpbin.org/headers',
    name: 'Request Headers',
    description: 'Returns all request headers'
  },
  {
    url: 'https://httpbin.org/json',
    name: 'JSON Response',
    description: 'Returns a sample JSON response'
  },
  {
    url: 'https://httpbin.org/html',
    name: 'HTML Response',
    description: 'Returns a sample HTML page'
  },
  {
    url: 'https://httpbin.org/delay/2',
    name: 'Delayed Response (2s)',
    description: 'Returns after a 2 second delay'
  },
  {
    url: 'https://httpbin.org/status/200',
    name: 'Success Status',
    description: 'Returns HTTP 200 status'
  },
  {
    url: 'https://httpbin.org/status/404',
    name: 'Not Found Status',
    description: 'Returns HTTP 404 status'
  },
  {
    url: 'https://httpbin.org/redirect/3',
    name: 'Multiple Redirects',
    description: 'Redirects 3 times before returning'
  },
  {
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    name: 'JSON API - Post',
    description: 'Returns a sample blog post'
  },
  {
    url: 'https://jsonplaceholder.typicode.com/users',
    name: 'JSON API - Users',
    description: 'Returns a list of users'
  },
  {
    url: 'https://api.github.com/repos/vercel/next.js',
    name: 'GitHub API - Repo Info',
    description: 'Returns Next.js repository information'
  },
  {
    url: 'https://example.com',
    name: 'Example.com',
    description: 'Simple HTML page for testing'
  },
  {
    url: 'https://www.wikipedia.org',
    name: 'Wikipedia Homepage',
    description: 'Wikipedia main page (large HTML)'
  }
]

const API_TESTS: ApiTest[] = [
  {
    id: 'get-stats',
    name: 'Get Dashboard Stats',
    method: 'GET',
    endpoint: '/api/stats',
    description: 'Fetches dashboard statistics including job counts and success rates',
  },
  {
    id: 'get-jobs',
    name: 'List Jobs',
    method: 'GET',
    endpoint: '/api/jobs?page=1&limit=10',
    description: 'Retrieves paginated list of jobs',
  },
  {
    id: 'get-projects',
    name: 'List Projects',
    method: 'GET',
    endpoint: '/api/projects',
    description: 'Retrieves all projects',
  },
  {
    id: 'create-job',
    name: 'Create Scraping Job',
    method: 'POST',
    endpoint: '/api/scrape',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      url: TEST_URLS[0].url, // Will be filled dynamically
      projectId: '', // Will be filled dynamically
      options: {
        useProxy: true,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      },
    },
    description: 'Creates a new scraping job',
  },
  {
    id: 'get-worker-status',
    name: 'Get Worker Status',
    method: 'GET',
    endpoint: '/api/worker',
    description: 'Checks the current worker status',
  },
  {
    id: 'start-worker',
    name: 'Start Worker',
    method: 'POST',
    endpoint: '/api/worker/start',
    description: 'Starts the background worker',
  },
  {
    id: 'stop-worker',
    name: 'Stop Worker',
    method: 'POST',
    endpoint: '/api/worker/stop',
    description: 'Stops the background worker',
  },
  {
    id: 'get-proxies',
    name: 'List Proxies',
    method: 'GET',
    endpoint: '/api/proxies',
    description: 'Retrieves all configured proxies',
  },
]

export default function ApiTestPage() {
  const [selectedTest, setSelectedTest] = useState<ApiTest>(API_TESTS[0])
  const [endpoint, setEndpoint] = useState(selectedTest.endpoint)
  const [headers, setHeaders] = useState(JSON.stringify(selectedTest.headers || {}, null, 2))
  const [body, setBody] = useState(JSON.stringify(selectedTest.body || {}, null, 2))
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [projectId, setProjectId] = useState<string>('')
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [selectedUrl, setSelectedUrl] = useState<string>(TEST_URLS[0].url)

  const handleTestSelect = (testId: string) => {
    const test = API_TESTS.find(t => t.id === testId)
    if (test) {
      setSelectedTest(test)
      setEndpoint(test.endpoint)
      setHeaders(JSON.stringify(test.headers || {}, null, 2))
      
      // Update body with current projectId and url if it's the create job test
      if (test.id === 'create-job') {
        const bodyObj = { ...test.body, projectId: projectId || '', url: selectedUrl }
        setBody(JSON.stringify(bodyObj, null, 2))
      } else {
        setBody(JSON.stringify(test.body || {}, null, 2))
      }
      
      setResult(null)
    }
  }

  const runTest = async () => {
    setLoading(true)
    setResult(null)
    
    const startTime = Date.now()
    
    try {
      const options: RequestInit = {
        method: selectedTest.method,
      }
      
      // Add headers if provided
      if (headers.trim()) {
        try {
          options.headers = JSON.parse(headers)
        } catch {
          throw new Error('Invalid JSON in headers')
        }
      }
      
      // Add body if method supports it and body is provided
      if (['POST', 'PUT'].includes(selectedTest.method) && body.trim()) {
        try {
          options.body = body
          options.headers = {
            'Content-Type': 'application/json',
            ...options.headers,
          }
        } catch {
          throw new Error('Invalid JSON in body')
        }
      }
      
      const response = await fetch(endpoint, options)
      const duration = Date.now() - startTime
      
      let responseData
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }
      
      setResult({
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        response: responseData,
        duration,
      })
    } catch (error) {
      const duration = Date.now() - startTime
      setResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getCurlCommand = () => {
    // Use a placeholder for origin during SSR
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    let curl = `curl -X ${selectedTest.method} \\\n  ${origin}${endpoint}`
    
    if (headers.trim()) {
      try {
        const headersObj = JSON.parse(headers)
        Object.entries(headersObj).forEach(([key, value]) => {
          curl += ` \\\n  -H "${key}: ${value}"`
        })
      } catch {}
    }
    
    if (['POST', 'PUT'].includes(selectedTest.method) && body.trim()) {
      curl += ` \\\n  -d '${body.replace(/\n/g, '')}'`
    }
    
    return curl
  }

  // Load projects on mount
  useEffect(() => {
    setLoadingProjects(true)
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data)
        if (data.length > 0) {
          setProjectId(data[0].id)
          // Update create job test with project ID and URL
          if (selectedTest.id === 'create-job') {
            const bodyObj = { ...selectedTest.body, projectId: data[0].id, url: selectedUrl }
            setBody(JSON.stringify(bodyObj, null, 2))
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingProjects(false))
  }, [])

  // Update body when project changes
  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId)
    
    // Update body if it's a test that uses projectId
    if (selectedTest.id === 'create-job' && body.includes('projectId')) {
      try {
        const bodyObj = JSON.parse(body)
        bodyObj.projectId = newProjectId
        setBody(JSON.stringify(bodyObj, null, 2))
      } catch (e) {
        // If body is not valid JSON, don't update
      }
    }
  }

  // Update body when URL changes
  const handleUrlChange = (newUrl: string) => {
    setSelectedUrl(newUrl)
    
    // Update body if it's a test that uses url
    if (selectedTest.id === 'create-job' && body.includes('url')) {
      try {
        const bodyObj = JSON.parse(body)
        bodyObj.url = newUrl
        setBody(JSON.stringify(bodyObj, null, 2))
      } catch (e) {
        // If body is not valid JSON, don't update
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Test Suite</h1>
        <p className="text-muted-foreground">
          Test API endpoints directly from the browser
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Test Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Available Tests</CardTitle>
            <CardDescription>
              Select a test to configure and run
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {API_TESTS.map((test) => (
                <button
                  key={test.id}
                  onClick={() => handleTestSelect(test.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTest.id === test.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{test.name}</span>
                    <Badge variant={test.method === 'GET' ? 'secondary' : 'default'}>
                      {test.method}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {test.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTest.name}</CardTitle>
                <CardDescription>
                  Configure and run the API test
                </CardDescription>
              </div>
              <Button
                onClick={runTest}
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run Test
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="request" className="space-y-4">
              <TabsList>
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="space-y-4">
                {/* Project Selector */}
                {!loadingProjects && projects.length > 0 && (
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={projectId} onValueChange={handleProjectChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      This project will be used for any API calls that require a project ID
                    </p>
                  </div>
                )}

                {/* URL Selector for scraping tests */}
                {selectedTest.id === 'create-job' && (
                  <div className="space-y-2">
                    <Label>Test URL</Label>
                    <Select value={selectedUrl} onValueChange={handleUrlChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a test URL" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEST_URLS.map((testUrl) => (
                          <SelectItem key={testUrl.url} value={testUrl.url}>
                            <div>
                              <div className="font-medium">{testUrl.name}</div>
                              <div className="text-sm text-muted-foreground">{testUrl.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Select a URL to test the scraping functionality
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <div className="flex gap-2">
                    <Badge className="px-3 py-2">{selectedTest.method}</Badge>
                    <Input
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                {selectedTest.headers && (
                  <div className="space-y-2">
                    <Label>Headers (JSON)</Label>
                    <Textarea
                      value={headers}
                      onChange={(e) => setHeaders(e.target.value)}
                      className="font-mono text-sm"
                      rows={4}
                    />
                  </div>
                )}

                {['POST', 'PUT'].includes(selectedTest.method) && (
                  <div className="space-y-2">
                    <Label>Body (JSON)</Label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="font-mono text-sm"
                      rows={8}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="response">
                {result ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {result.status === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">
                          Status: {result.statusCode || 'Error'}
                        </span>
                        {result.duration && (
                          <span className="text-sm text-muted-foreground">
                            {result.duration}ms
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Response</Label>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                        <pre className="text-sm">
                          {result.error || JSON.stringify(result.response, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <Code2 className="h-4 w-4" />
                    <AlertDescription>
                      Run the test to see the response
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="curl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>cURL Command</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getCurlCommand())}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="text-sm font-mono">{getCurlCommand()}</pre>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}