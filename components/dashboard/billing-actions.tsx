'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface BillingActionsProps {
  subscriptionId?: string | null
  cancelAtPeriodEnd?: boolean | null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BillingActions({ subscriptionId: _subscriptionId, cancelAtPeriodEnd: _cancelAtPeriodEnd }: BillingActionsProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleManageBilling() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast({ title: 'Error', description: 'Failed to open billing portal', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to open billing portal', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleManageBilling} disabled={loading}>
      {loading ? 'Loading...' : 'Manage Billing & Invoices'}
    </Button>
  )
}
