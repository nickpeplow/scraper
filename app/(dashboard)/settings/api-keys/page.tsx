'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ApiKeyList } from '@/components/settings/api-key-list'
import { ApiKeyForm } from '@/components/settings/api-key-form'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Plus, Key, AlertCircle } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key: string
  lastUsedAt?: string
  createdAt: string
  expiresAt?: string
  jobCount: number
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newKeyData, setNewKeyData] = useState<{ key: string; name: string } | null>(null)

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys)
      }
    } catch (error) {
      console.error('Failed to load API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApiKeys()
  }, [])

  const handleKeyCreated = (keyData: { key: string; name: string }) => {
    setNewKeyData(keyData)
    setIsCreateOpen(false)
    loadApiKeys()
  }

  const handleKeyDeleted = (id: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground">
          Manage your API keys for programmatic access
        </p>
      </div>

      {newKeyData && (
        <Alert>
          <Key className="h-4 w-4" />
          <AlertTitle>New API Key Created</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              Save this API key securely. You won't be able to see it again.
            </p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm break-all">
              {newKeyData.key}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                navigator.clipboard.writeText(newKeyData.key)
              }}
            >
              Copy to Clipboard
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Use API keys to authenticate requests to the Scraper API
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <ApiKeyForm onSuccess={handleKeyCreated} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ApiKeyList 
            apiKeys={apiKeys} 
            loading={loading}
            onKeyDeleted={handleKeyDeleted}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Using Your API Key</CardTitle>
          <CardDescription>
            Include your API key in the request headers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">cURL Example</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm overflow-x-auto">
{`curl -X POST https://your-domain.com/api/scrape \\
  -H "x-api-key: sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com", "projectId": "your-project-id"}'`}
              </pre>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">JavaScript Example</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm overflow-x-auto">
{`const response = await fetch('https://your-domain.com/api/scrape', {
  method: 'POST',
  headers: {
    'x-api-key': 'sk_your_api_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com',
    projectId: 'your-project-id'
  })
});`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}