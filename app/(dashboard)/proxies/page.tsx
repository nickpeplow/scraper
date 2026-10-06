'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProxyList } from '@/components/proxies/proxy-list'
import { ProxyStats } from '@/components/proxies/proxy-stats'
import { ProxyImport } from '@/components/proxies/proxy-import'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Upload } from 'lucide-react'

export default function ProxiesPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const handleImportSuccess = () => {
    setIsImportOpen(false)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proxy Management</h1>
          <p className="text-muted-foreground">
            Manage your proxy servers for web scraping
          </p>
        </div>
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Import Proxies
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <ProxyImport onSuccess={handleImportSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <ProxyStats refreshKey={refreshKey} />
      <ProxyList refreshKey={refreshKey} />
    </div>
  )
}