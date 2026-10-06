'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Key, 
  Copy, 
  Trash2, 
  Clock,
  Activity
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ApiKey {
  id: string
  name: string
  key: string
  lastUsedAt?: string
  createdAt: string
  expiresAt?: string
  jobCount: number
}

interface ApiKeyListProps {
  apiKeys: ApiKey[]
  loading?: boolean
  onKeyDeleted?: (id: string) => void
}

export function ApiKeyList({ apiKeys, loading, onKeyDeleted }: ApiKeyListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null)

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
  }

  const confirmDelete = (apiKey: ApiKey) => {
    setKeyToDelete(apiKey)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!keyToDelete) return

    setDeletingId(keyToDelete.id)
    setDeleteDialogOpen(false)

    try {
      const response = await fetch(`/api/api-keys/${keyToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onKeyDeleted?.(keyToDelete.id)
      }
    } catch (error) {
      console.error('Failed to delete API key:', error)
    } finally {
      setDeletingId(null)
      setKeyToDelete(null)
    }
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-8">
        <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">No API keys yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first API key to start using the API
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell className="font-medium">{apiKey.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {apiKey.key}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyKey(apiKey.key)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                {apiKey.lastUsedAt ? (
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {formatDistanceToNow(new Date(apiKey.lastUsedAt), { addSuffix: true })}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm">{apiKey.jobCount} requests</span>
              </TableCell>
              <TableCell>
                {isExpired(apiKey.expiresAt) ? (
                  <Badge variant="destructive">Expired</Badge>
                ) : apiKey.expiresAt ? (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Expires {formatDistanceToNow(new Date(apiKey.expiresAt), { addSuffix: true })}
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmDelete(apiKey)}
                  disabled={deletingId === apiKey.id}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the API key "{keyToDelete?.name}"? 
              This action cannot be undone and any applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}