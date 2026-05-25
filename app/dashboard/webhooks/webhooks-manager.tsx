'use client'

import { useState, useTransition } from 'react'
import { createWebhook, deleteWebhook, toggleWebhook } from '@/actions/webhooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface WebhookRow {
  id: string
  name: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  created_at: string
}

interface WebhooksManagerProps {
  webhooks: WebhookRow[]
}

export function WebhooksManager({ webhooks: initialWebhooks }: WebhooksManagerProps) {
  const { toast } = useToast()
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const [showForm, setShowForm] = useState(false)
  const [webhookName, setWebhookName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createWebhook(formData)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        setWebhookName('')
        setWebhookUrl('')
        setShowForm(false)
        toast({ title: 'Webhook created', description: 'Your webhook endpoint is now active.' })
      }
    })
  }

  async function handleDelete(webhookId: string) {
    setDeletingId(webhookId)
    const result = await deleteWebhook(webhookId)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      setWebhooks(prev => prev.filter(w => w.id !== webhookId))
      toast({ title: 'Webhook deleted' })
    }
    setDeletingId(null)
  }

  async function handleToggle(webhookId: string, currentActive: boolean) {
    setTogglingId(webhookId)
    const newActive = !currentActive
    const result = await toggleWebhook(webhookId, newActive)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      setWebhooks(prev =>
        prev.map(w => w.id === webhookId ? { ...w, is_active: newActive } : w)
      )
    }
    setTogglingId(null)
  }

  function toggleSecretReveal(id: string) {
    setRevealedSecrets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function maskSecret(secret: string) {
    return secret.slice(0, 10) + '•'.repeat(Math.max(0, secret.length - 14)) + secret.slice(-4)
  }

  return (
    <div className="space-y-6">
      {/* Webhooks Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Receive real-time notifications when events happen in Stackly.
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(v => !v)} variant={showForm ? 'outline' : 'default'}>
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Cancel' : 'Add Webhook'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inline create form */}
          {showForm && (
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg border bg-slate-50">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="webhook-name">Name</label>
                <Input
                  id="webhook-name"
                  name="name"
                  placeholder="e.g. My App"
                  value={webhookName}
                  onChange={e => setWebhookName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="webhook-url">Endpoint URL (HTTPS)</label>
                <Input
                  id="webhook-url"
                  name="url"
                  type="url"
                  placeholder="https://your-app.com/webhook"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isPending || !webhookName.trim() || !webhookUrl.trim()}
                >
                  {isPending ? 'Creating...' : 'Create Webhook'}
                </Button>
              </div>
            </form>
          )}

          {/* Webhooks table */}
          {webhooks.length === 0 && !showForm ? (
            <div className="text-center py-10 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>No webhooks yet. Add one to start receiving events.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Secret</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map(webhook => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{webhook.name}</span>
                        <div className="flex gap-1 flex-wrap">
                          {webhook.events.map(ev => (
                            <Badge key={ev} variant="secondary" className="text-xs">{ev}</Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground font-mono text-xs">
                        {webhook.url.length > 50 ? webhook.url.slice(0, 50) + '…' : webhook.url}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={() => handleToggle(webhook.id, webhook.is_active)}
                          disabled={togglingId === webhook.id}
                          aria-label={webhook.is_active ? 'Deactivate webhook' : 'Activate webhook'}
                        />
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                          {revealedSecrets.has(webhook.id) ? webhook.secret : maskSecret(webhook.secret)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleSecretReveal(webhook.id)}
                          title={revealedSecrets.has(webhook.id) ? 'Hide secret' : 'Reveal secret'}
                        >
                          {revealedSecrets.has(webhook.id)
                            ? <EyeOff className="h-3 w-3" />
                            : <Eye className="h-3 w-3" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(webhook.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(webhook.id)}
                        disabled={deletingId === webhook.id}
                        title="Delete webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payload Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook Payload</CardTitle>
          <CardDescription>
            Stackly sends a <code className="text-xs bg-slate-100 px-1 rounded">POST</code> request to your endpoint with the following JSON body for each event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
{`{
  "event": "click",
  "link_id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "country": "MY",
  "device": "mobile"
}`}
          </pre>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Verifying webhook signatures</p>
            <p>
              Each request includes an <code className="bg-slate-100 px-1 rounded text-xs">X-Stackly-Signature</code> header
              containing an HMAC-SHA256 signature of the raw request body, signed with your webhook secret.
              Verify this signature to ensure requests come from Stackly.
            </p>
            <div className="bg-slate-900 rounded-lg p-3">
              <pre className="text-slate-100 text-xs overflow-x-auto">
{`// Node.js example
const crypto = require('crypto')
const sig = req.headers['x-stackly-signature']
const expected = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex')
const isValid = sig === expected`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
