'use client'

import { useState } from 'react'
import { createLink } from '@/actions/links'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Link2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface CreateLinkDialogProps {
  canCreate: boolean
  plan?: string
}

function buildPreviewUrl(
  destinationUrl: string,
  utm: {
    utm_source: string
    utm_medium: string
    utm_campaign: string
    utm_term: string
    utm_content: string
  }
): string {
  if (!destinationUrl) return ''
  try {
    const url = new URL(destinationUrl)
    if (utm.utm_source) url.searchParams.set('utm_source', utm.utm_source)
    if (utm.utm_medium) url.searchParams.set('utm_medium', utm.utm_medium)
    if (utm.utm_campaign) url.searchParams.set('utm_campaign', utm.utm_campaign)
    if (utm.utm_term) url.searchParams.set('utm_term', utm.utm_term)
    if (utm.utm_content) url.searchParams.set('utm_content', utm.utm_content)
    return url.toString()
  } catch {
    return destinationUrl
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CreateLinkDialog({ canCreate, plan: _plan }: CreateLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUtm, setShowUtm] = useState(false)
  const [destinationUrl, setDestinationUrl] = useState('')
  const [utm, setUtm] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
  })
  const { toast } = useToast()

  const previewUrl = buildPreviewUrl(destinationUrl, utm)
  const hasUtmParams = Object.values(utm).some((v) => v.trim() !== '')

  function handleReset() {
    setDestinationUrl('')
    setUtm({ utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' })
    setShowUtm(false)
    setError(null)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await createLink(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    toast({
      title: 'Link created!',
      description: `Your short link is ready to share.`,
    })
    setOpen(false)
    setLoading(false)
    handleReset()
  }

  if (!canCreate) {
    return (
      <Link href="/dashboard/billing">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Upgrade to Create More
        </Button>
      </Link>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) handleReset() }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Create New Link
          </DialogTitle>
          <DialogDescription>
            Shorten a URL and start tracking clicks instantly.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="destination_url">Destination URL *</Label>
              <Input
                id="destination_url"
                name="destination_url"
                type="url"
                placeholder="https://example.com/your-long-url"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Shopee Campaign - August 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Custom Slug (optional)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">stackly.my/</span>
                <Input
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder="my-link"
                  pattern="[a-zA-Z0-9_-]+"
                  title="Only letters, numbers, hyphens, and underscores"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for a random slug. Only letters, numbers, - and _ allowed.
              </p>
            </div>

            {/* UTM Parameters collapsible section */}
            <div className="border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setShowUtm((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-muted/40 hover:bg-muted/70 transition-colors"
              >
                <span className="flex items-center gap-2">
                  UTM Parameters
                  <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  {hasUtmParams && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Active
                    </span>
                  )}
                </span>
                {showUtm ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {showUtm && (
                <div className="px-4 py-4 space-y-3 bg-background">
                  <p className="text-xs text-muted-foreground">
                    UTM params will be appended to your destination URL on every redirect.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="utm_source" className="text-xs">Source</Label>
                      <Input
                        id="utm_source"
                        name="utm_source"
                        type="text"
                        placeholder="facebook"
                        className="h-8 text-sm"
                        value={utm.utm_source}
                        onChange={(e) => setUtm((prev) => ({ ...prev, utm_source: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="utm_medium" className="text-xs">Medium</Label>
                      <Input
                        id="utm_medium"
                        name="utm_medium"
                        type="text"
                        placeholder="social"
                        className="h-8 text-sm"
                        value={utm.utm_medium}
                        onChange={(e) => setUtm((prev) => ({ ...prev, utm_medium: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="utm_campaign" className="text-xs">Campaign</Label>
                      <Input
                        id="utm_campaign"
                        name="utm_campaign"
                        type="text"
                        placeholder="raya2026"
                        className="h-8 text-sm"
                        value={utm.utm_campaign}
                        onChange={(e) => setUtm((prev) => ({ ...prev, utm_campaign: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="utm_term" className="text-xs">Term</Label>
                      <Input
                        id="utm_term"
                        name="utm_term"
                        type="text"
                        placeholder="keyword"
                        className="h-8 text-sm"
                        value={utm.utm_term}
                        onChange={(e) => setUtm((prev) => ({ ...prev, utm_term: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label htmlFor="utm_content" className="text-xs">Content</Label>
                      <Input
                        id="utm_content"
                        name="utm_content"
                        type="text"
                        placeholder="banner_ad"
                        className="h-8 text-sm"
                        value={utm.utm_content}
                        onChange={(e) => setUtm((prev) => ({ ...prev, utm_content: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Live preview */}
                  {previewUrl && hasUtmParams && (
                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-medium text-muted-foreground">Final redirect URL preview:</p>
                      <div className="rounded-md bg-muted px-3 py-2 break-all text-xs font-mono text-muted-foreground">
                        {previewUrl}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
