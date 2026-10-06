'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'

const importSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  proxyType: z.enum(['datacenter', 'residential', 'mobile']),
  proxies: z.string().min(1, 'Proxy list is required'),
})

type ImportFormData = z.infer<typeof importSchema>

interface ProxyImportProps {
  onSuccess?: () => void
}

export function ProxyImport({ onSuccess }: ProxyImportProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      provider: '',
      proxyType: 'datacenter',
      proxies: '',
    },
  })

  const onSubmit = async (data: ImportFormData) => {
    setIsSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: result.message || `Successfully imported ${result.imported} proxies`,
        })
        form.reset()
        if (onSuccess) {
          setTimeout(onSuccess, 2000)
        }
      } else {
        setResult({
          success: false,
          message: result.error || 'Failed to import proxies',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred while importing proxies',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        form.setValue('proxies', e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Proxies</CardTitle>
        <CardDescription>
          Import multiple proxies from a text file or paste them directly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {result && (
              <Alert variant={result.success ? 'default' : 'destructive'}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., webshare, brightdata" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of your proxy provider
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proxyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proxy Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select proxy type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="datacenter">Datacenter</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of proxies you're importing
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proxies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proxy List</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="host:port:username:password&#10;192.168.1.1:8080:user:pass&#10;..."
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste your proxies in the format: host:port:username:password (one per line)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Proxies'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}