'use client'

import { useState } from 'react'
import { updateLink } from '@/actions/links'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LinkData {
  id: string
  slug: string
  destination_url: string
  title: string | null
  expires_at: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
}

interface EditLinkDialogProps {
  link: LinkData
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildPreviewUrl(destinationUrl: string, utm: Record<string, string>): string {
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

// Format ISO date to datetime-local input value (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export function EditLinkDialog({ link, open, onOpenChange }: EditLinkDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUtm, setShowUtm] = useState(
    !!(link.utm_source || link.utm_medium || link.utm_campaign || link.utm_term || link.utm_content)
  )
  const [destinationUrl, setDestinationUrl] = useState(link.destination_url)
  const [utm, setUtm] = useState({
    utm_source: link.utm_source || '',
    utm_medium: link.utm_medium || '',
    utm_campaign: link.utm_campaign || '',
    utm_term: link.utm_term || '',
    utm_content: link.utm_content || '',
  })
  const { toast } = useToast()

  const hasUtmParams = Object.values(utm).some((v) => v.trim() !== '')
  const previewUrl = buildPreviewUrl(destinationUrl, utm)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await updateLink(link.id, formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    toast({ title: 'Link updated!', description: 'Your changes have been saved.' })
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Link
          </DialogTitle>
          <DialogDescription>
            Update destination, UTM params, or expiry for{' '}
            <span className="font-mono text-xs text-foreground">/{link.slug}</span>
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                {error}
              </div>
            )}

            {/* Slug (read-only) */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Short URL (cannot be changed)</Label>
              <div className="flex items-center h-9 rounded-md border bg-muted px-3 text-sm text-muted-foreground font-mono">
                stackly.my/{link.slug}
              </div>
            </div>

            {/* Destination URL */}
            <div className="space-y-2">
              <Label htmlFor="edit_destination_url">Destination URL *</Label>
              <Input
                id="edit_destination_url"
                name="destination_url"
                type="url"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit_title">Title (optional)</Label>
              <Input
                id="edit_title"
                name="title"
                type="text"
                defaultValue={link.title || ''}
                placeholder="e.g. Shopee Campaign"
              />
            </div>

            {/* Expiry */}
            <div className="space-y-2">
              <Label htmlFor="edit_expires_at">Expiry date (optional)</Label>
              <Input
                id="edit_expires_at"
                name="expires_at"
                type="datetime-local"
                defaultValue={toDatetimeLocal(link.expires_at)}
              />
              <p className="text-xs text-muted-foreground">
                Link will return 404 after this date. Leave empty for no expiry.
              </p>
            </div>

            {/* UTM Parameters */}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit_utm_source" className="text-xs">Source</Label>
                      <Input id="edit_utm_source" name="utm_source" type="text" placeholder="facebook" className="h-8 text-sm"
                        value={utm.utm_source} onChange={(e) => setUtm((p) => ({ ...p, utm_source: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit_utm_medium" className="text-xs">Medium</Label>
                      <Input id="edit_utm_medium" name="utm_medium" type="text" placeholder="social" className="h-8 text-sm"
                        value={utm.utm_medium} onChange={(e) => setUtm((p) => ({ ...p, utm_medium: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit_utm_campaign" className="text-xs">Campaign</Label>
                      <Input id="edit_utm_campaign" name="utm_campaign" type="text" placeholder="raya2026" className="h-8 text-sm"
                        value={utm.utm_campaign} onChange={(e) => setUtm((p) => ({ ...p, utm_campaign: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit_utm_term" className="text-xs">Term</Label>
                      <Input id="edit_utm_term" name="utm_term" type="text" placeholder="keyword" className="h-8 text-sm"
                        value={utm.utm_term} onChange={(e) => setUtm((p) => ({ ...p, utm_term: e.target.value }))} />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label htmlFor="edit_utm_content" className="text-xs">Content</Label>
                      <Input id="edit_utm_content" name="utm_content" type="text" placeholder="banner_ad" className="h-8 text-sm"
                        value={utm.utm_content} onChange={(e) => setUtm((p) => ({ ...p, utm_content: e.target.value }))} />
                    </div>
                  </div>

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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
