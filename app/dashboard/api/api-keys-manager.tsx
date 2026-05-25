'use client'

import { useState, useTransition } from 'react'
import { createApiKey, deleteApiKey } from '@/actions/api-keys'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Plus, Trash2, Copy, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface ApiKeyRow {
  id: string
  name: string
  key_preview: string
  last_used_at: string | null
  created_at: string
}

interface ApiKeysManagerProps {
  apiKeys: ApiKeyRow[]
  baseUrl: string
}

export function ApiKeysManager({ apiKeys, baseUrl }: ApiKeysManagerProps) {
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDocs, setShowDocs] = useState(false)
  const [showCreatedKey, setShowCreatedKey] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createApiKey(formData)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else if (result.key) {
        setCreatedKey(result.key)
        setNewKeyName('')
        setShowForm(false)
        setShowCreatedKey(false)
        toast({ title: 'API Key created', description: 'Your new API key is ready. Copy it now!' })
      }
    })
  }

  async function handleDelete(keyId: string) {
    setDeletingId(keyId)
    const result = await deleteApiKey(keyId)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Key deleted', description: 'API key has been revoked.' })
    }
    setDeletingId(null)
  }

  async function copyToClipboard(text: string, label = 'Copied!') {
    await navigator.clipboard.writeText(text)
    toast({ title: label, description: 'Copied to clipboard.' })
  }

  const apiBaseUrl = `${baseUrl}/api/v1`

  return (
    <div className="space-y-6">
      {/* New Key Banner */}
      {createdKey && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-green-800 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Your new API key — copy it now!
            </CardTitle>
            <CardDescription className="text-green-700">
              This key will not be shown again. Store it somewhere safe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-white border border-green-200 px-3 py-2 text-sm font-mono overflow-x-auto">
                {showCreatedKey ? createdKey : createdKey.slice(0, 6) + '•'.repeat(createdKey.length - 10) + createdKey.slice(-4)}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowCreatedKey(v => !v)}
                title={showCreatedKey ? 'Hide key' : 'Show key'}
              >
                {showCreatedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(createdKey, 'API key copied!')}
                title="Copy key"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-green-700 hover:text-green-900"
              onClick={() => setCreatedKey(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Use API keys to authenticate requests to the Stackly REST API. Keep them secret.
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(v => !v)} variant={showForm ? 'outline' : 'default'}>
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Cancel' : 'Create New Key'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inline create form */}
          {showForm && (
            <form onSubmit={handleCreate} className="flex items-end gap-3 p-4 rounded-lg border bg-slate-50">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium" htmlFor="key-name">Key name</label>
                <Input
                  id="key-name"
                  name="name"
                  placeholder="e.g. Production, My App"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={isPending || !newKeyName.trim()}>
                {isPending ? 'Creating...' : 'Create Key'}
              </Button>
            </form>
          )}

          {/* Keys table */}
          {apiKeys.length === 0 && !showForm ? (
            <div className="text-center py-10 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>No API keys yet. Create one to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Used</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map(key => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                        sk_...{key.key_preview}
                      </code>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(key.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(key.id)}
                        disabled={deletingId === key.id}
                        title="Revoke key"
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

      {/* API Documentation */}
      <Card>
        <CardHeader className="cursor-pointer select-none" onClick={() => setShowDocs(v => !v)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">API Documentation</CardTitle>
              <CardDescription>Base URL: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{apiBaseUrl}</code></CardDescription>
            </div>
            {showDocs ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {showDocs && (
          <CardContent className="space-y-6">
            {/* Authentication */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Pass your API key in the <code className="bg-slate-100 px-1 rounded text-xs">Authorization</code> header as a Bearer token.
              </p>
            </div>

            {/* GET /links */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">GET</span>
                <code className="text-sm">/api/v1/links</code>
                <span className="text-xs text-muted-foreground">— List your links</span>
              </div>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
{`curl -H "Authorization: Bearer sk_your_key_here" \\
  ${apiBaseUrl}/links?limit=20&offset=0`}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-slate-100"
                  onClick={() => copyToClipboard(`curl -H "Authorization: Bearer sk_your_key_here" \\\n  ${apiBaseUrl}/links?limit=20&offset=0`)}
                  title="Copy"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* POST /links */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded">POST</span>
                <code className="text-sm">/api/v1/links</code>
                <span className="text-xs text-muted-foreground">— Create a link</span>
              </div>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
{`curl -X POST \\
  -H "Authorization: Bearer sk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","title":"My Link"}' \\
  ${apiBaseUrl}/links`}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-slate-100"
                  onClick={() => copyToClipboard(`curl -X POST \\\n  -H "Authorization: Bearer sk_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url":"https://example.com","title":"My Link"}' \\\n  ${apiBaseUrl}/links`)}
                  title="Copy"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* GET /links/:id */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">GET</span>
                <code className="text-sm">/api/v1/links/:id</code>
                <span className="text-xs text-muted-foreground">— Get a single link</span>
              </div>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
{`curl -H "Authorization: Bearer sk_your_key_here" \\
  ${apiBaseUrl}/links/LINK_ID`}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-slate-100"
                  onClick={() => copyToClipboard(`curl -H "Authorization: Bearer sk_your_key_here" \\\n  ${apiBaseUrl}/links/LINK_ID`)}
                  title="Copy"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* DELETE /links/:id */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded">DELETE</span>
                <code className="text-sm">/api/v1/links/:id</code>
                <span className="text-xs text-muted-foreground">— Deactivate a link</span>
              </div>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
{`curl -X DELETE \\
  -H "Authorization: Bearer sk_your_key_here" \\
  ${apiBaseUrl}/links/LINK_ID`}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-slate-100"
                  onClick={() => copyToClipboard(`curl -X DELETE \\\n  -H "Authorization: Bearer sk_your_key_here" \\\n  ${apiBaseUrl}/links/LINK_ID`)}
                  title="Copy"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
