'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function SendTestEmailButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSend() {
    setLoading(true)
    try {
      const res = await fetch('/api/email/test', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        toast({ title: 'Failed to send', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: 'Test email sent!', description: 'Check your inbox for the weekly report preview.' })
      }
    } catch {
      toast({ title: 'Error', description: 'Could not send test email.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSend} disabled={loading} className="gap-2">
      <Mail className="h-4 w-4" />
      {loading ? 'Sending…' : 'Send test email'}
    </Button>
  )
}
