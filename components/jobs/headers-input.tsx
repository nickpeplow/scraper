'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus } from 'lucide-react'

interface Header {
  id: string
  key: string
  value: string
}

interface HeadersInputProps {
  value?: Record<string, string>
  onChange: (headers: Record<string, string>) => void
}

export function HeadersInput({ value = {}, onChange }: HeadersInputProps) {
  const [headers, setHeaders] = useState<Header[]>(() => {
    const entries = Object.entries(value)
    return entries.length > 0
      ? entries.map(([key, val], index) => ({
          id: `header-${index}`,
          key,
          value: val,
        }))
      : [{ id: 'header-0', key: '', value: '' }]
  })

  const addHeader = () => {
    const newHeader: Header = {
      id: `header-${Date.now()}`,
      key: '',
      value: '',
    }
    setHeaders([...headers, newHeader])
  }

  const removeHeader = (id: string) => {
    const newHeaders = headers.filter((h) => h.id !== id)
    if (newHeaders.length === 0) {
      newHeaders.push({ id: 'header-0', key: '', value: '' })
    }
    setHeaders(newHeaders)
    updateHeaders(newHeaders)
  }

  const updateHeader = (id: string, field: 'key' | 'value', val: string) => {
    const newHeaders = headers.map((h) =>
      h.id === id ? { ...h, [field]: val } : h
    )
    setHeaders(newHeaders)
    updateHeaders(newHeaders)
  }

  const updateHeaders = (headersList: Header[]) => {
    const headersObject = headersList.reduce((acc, header) => {
      if (header.key && header.value) {
        acc[header.key] = header.value
      }
      return acc
    }, {} as Record<string, string>)
    onChange(headersObject)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Custom Headers</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addHeader}
          className="h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Header
        </Button>
      </div>
      <div className="space-y-2">
        {headers.map((header) => (
          <div key={header.id} className="flex gap-2">
            <Input
              placeholder="Header name"
              value={header.key}
              onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Header value"
              value={header.value}
              onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeHeader(header.id)}
              className="h-10 w-10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Add custom HTTP headers to send with the request
      </p>
    </div>
  )
}