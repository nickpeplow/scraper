'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Key, AlertCircle } from 'lucide-react'

const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  expiresIn: z.enum(['30d', '90d', '365d', 'never']),
})

type ApiKeyFormData = z.infer<typeof apiKeySchema>

interface ApiKeyFormProps {
  onSuccess?: (keyData: { key: string; name: string }) => void
}

export function ApiKeyForm({ onSuccess }: ApiKeyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: '',
      expiresIn: '90d',
    },
  })

  const onSubmit = async (data: ApiKeyFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        form.reset()
        if (onSuccess) {
          onSuccess({ key: result.key, name: result.name })
        }
      } else {
        setError(result.error || 'Failed to create API key')
      }
    } catch (error) {
      setError('An error occurred while creating the API key')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New API Key</CardTitle>
        <CardDescription>
          Generate a new API key for programmatic access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Production API Key" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name to help you identify this key
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="90d">90 days</SelectItem>
                      <SelectItem value="365d">1 year</SelectItem>
                      <SelectItem value="never">Never expires</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How long this API key should remain valid
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                API keys allow full access to your account. Keep them secure.
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create API Key'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}