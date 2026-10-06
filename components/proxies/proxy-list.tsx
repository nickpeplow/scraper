'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Proxy {
  id: string
  host: string
  port: number
  protocol: string
  proxyType: string
  provider: string
  countryCode?: string
  status: string
  lastUsedAt?: string
  failureCount: number
  successCount: number
  successRate: number
  lastError?: string
}

interface ProxyListProps {
  refreshKey?: number
}

export function ProxyList({ refreshKey }: ProxyListProps) {
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [providerFilter, setProviderFilter] = useState<string>('all')

  useEffect(() => {
    const fetchProxies = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        })
        
        if (statusFilter !== 'all') params.append('status', statusFilter)
        if (providerFilter !== 'all') params.append('provider', providerFilter)

        const response = await fetch(`/api/proxies?${params}`)
        if (response.ok) {
          const data = await response.json()
          setProxies(data.proxies)
          setTotalPages(data.pagination.totalPages)
        }
      } catch (error) {
        console.error('Failed to fetch proxies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProxies()
  }, [page, statusFilter, providerFilter, refreshKey])

  const updateProxyStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/proxies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (response.ok) {
        setProxies(prev => prev.map(proxy => 
          proxy.id === id ? { ...proxy, status } : proxy
        ))
      }
    } catch (error) {
      console.error('Failed to update proxy:', error)
    }
  }

  const deleteProxy = async (id: string) => {
    try {
      const response = await fetch(`/api/proxies/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setProxies(prev => prev.filter(proxy => proxy.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete proxy:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'blacklisted':
        return <Badge variant="secondary">Blacklisted</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // Get unique providers for filter
  const providers = [...new Set(proxies.map(p => p.provider))]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Proxy Servers</CardTitle>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map(provider => (
                  <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : proxies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No proxies found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proxy</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proxies.map((proxy) => (
                  <TableRow key={proxy.id}>
                    <TableCell className="font-mono text-sm">
                      {proxy.host}:{proxy.port}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {proxy.proxyType}
                      </Badge>
                    </TableCell>
                    <TableCell>{proxy.provider}</TableCell>
                    <TableCell>{proxy.countryCode || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(proxy.status)}
                        {getStatusBadge(proxy.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{proxy.successRate}%</span>
                        <span className="text-xs text-muted-foreground">
                          ({proxy.successCount}/{proxy.successCount + proxy.failureCount})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {proxy.lastUsedAt
                        ? formatDistanceToNow(new Date(proxy.lastUsedAt), { addSuffix: true })
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {proxy.status !== 'active' && (
                            <DropdownMenuItem onClick={() => updateProxyStatus(proxy.id, 'active')}>
                              Mark as Active
                            </DropdownMenuItem>
                          )}
                          {proxy.status !== 'failed' && (
                            <DropdownMenuItem onClick={() => updateProxyStatus(proxy.id, 'failed')}>
                              Mark as Failed
                            </DropdownMenuItem>
                          )}
                          {proxy.status !== 'blacklisted' && (
                            <DropdownMenuItem onClick={() => updateProxyStatus(proxy.id, 'blacklisted')}>
                              Blacklist
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteProxy(proxy.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}