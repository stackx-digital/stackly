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
  const [showPixel, setShowPixel] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [destinationUrl, setDestinationUrl] = useState('')
  const [utm, setUtm] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
  })
  const [pixels, setPixels] = useState({
    pixel_fb: '',
    pixel_ga: '',
    pixel_gtm: '',
    pixel_gads: '',
    pixel_tiktok: '',
  })
  const [geoRules, setGeoRules] = useState<Array<{ country: string; url: string }>>([])

  function addGeoRule() {
    if (geoRules.length < 5) setGeoRules((prev) => [...prev, { country: '', url: '' }])
  }
  function removeGeoRule(idx: number) {
    setGeoRules((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateGeoRule(idx: number, field: 'country' | 'url', value: string) {
    setGeoRules((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }
  const { toast } = useToast()

  const previewUrl = buildPreviewUrl(destinationUrl, utm)
  const hasUtmParams = Object.values(utm).some((v) => v.trim() !== '')
  const hasPixels = Object.values(pixels).some((v) => v.trim() !== '')

  function handleReset() {
    setDestinationUrl('')
    setUtm({ utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' })
    setPixels({ pixel_fb: '', pixel_ga: '', pixel_gtm: '', pixel_gads: '', pixel_tiktok: '' })
    setGeoRules([])
    setShowUtm(false)
    setShowPixel(false)
    setShowAdvanced(false)
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

            {/* Hidden input to pass serialised geo rules */}
            <input
              type="hidden"
              name="geo_rules"
              value={JSON.stringify(geoRules.filter((r) => r.country && r.url))}
            />

            {/* Advanced Options collapsible section */}
            <div className="border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-muted/40 hover:bg-muted/70 transition-colors"
              >
                <span className="flex items-center gap-2">
                  Advanced Options
                  <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {showAdvanced && (
                <div className="px-4 py-4 space-y-4 bg-background">
                  <div className="space-y-1">
                    <Label htmlFor="active_from" className="text-xs">Go live on (optional)</Label>
                    <input
                      id="active_from"
                      name="active_from"
                      type="datetime-local"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">Link will return 404 until this time.</p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="password_input" className="text-xs">Password protect (optional)</Label>
                    <input
                      id="password_input"
                      name="password_input"
                      type="password"
                      placeholder="Leave empty for no password"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="redirect_mobile" className="text-xs">Mobile Redirect (optional)</Label>
                    <input
                      id="redirect_mobile"
                      name="redirect_mobile"
                      type="url"
                      placeholder="https://app.example.com/mobile"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="redirect_tablet" className="text-xs">Tablet Redirect (optional)</Label>
                    <input
                      id="redirect_tablet"
                      name="redirect_tablet"
                      type="url"
                      placeholder="https://tablet.example.com"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  {/* Geo Rules */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Country Redirect Rules (optional)</Label>
                      {geoRules.length < 5 && (
                        <button
                          type="button"
                          onClick={addGeoRule}
                          className="text-xs text-primary hover:underline"
                        >
                          + Add Rule
                        </button>
                      )}
                    </div>
                    {geoRules.length === 0 && (
                      <p className="text-xs text-muted-foreground">No country rules. Click &ldquo;+ Add Rule&rdquo; to redirect specific countries to a different URL.</p>
                    )}
                    {geoRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="MY"
                          maxLength={2}
                          value={rule.country}
                          onChange={(e) => updateGeoRule(idx, 'country', e.target.value.toUpperCase())}
                          className="flex h-8 w-16 rounded-md border border-input bg-background px-2 text-xs uppercase shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <input
                          type="url"
                          placeholder="https://shopee.my"
                          value={rule.url}
                          onChange={(e) => updateGeoRule(idx, 'url', e.target.value)}
                          className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => removeGeoRule(idx)}
                          className="text-xs text-destructive hover:underline shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

            {/* Pixel Tracking collapsible section */}
            <div className="border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPixel((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-muted/40 hover:bg-muted/70 transition-colors"
              >
                <span className="flex items-center gap-2">
                  Pixel Tracking
                  <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  {hasPixels && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Active
                    </span>
                  )}
                </span>
                {showPixel ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {showPixel && (
                <div className="px-4 py-4 space-y-3 bg-background">
                  <p className="text-xs text-muted-foreground">
                    Pixel scripts fire on an intermediate page before redirecting. Leave blank to skip.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="pixel_fb" className="text-xs">Facebook Pixel ID</Label>
                      <Input
                        id="pixel_fb"
                        name="pixel_fb"
                        type="text"
                        placeholder="123456789012345"
                        className="h-8 text-sm"
                        value={pixels.pixel_fb}
                        onChange={(e) => setPixels((prev) => ({ ...prev, pixel_fb: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in Meta Events Manager &rarr; Data Sources.</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pixel_ga" className="text-xs">Google Analytics 4</Label>
                      <Input
                        id="pixel_ga"
                        name="pixel_ga"
                        type="text"
                        placeholder="G-XXXXXXXXXX"
                        className="h-8 text-sm"
                        value={pixels.pixel_ga}
                        onChange={(e) => setPixels((prev) => ({ ...prev, pixel_ga: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in GA4 Admin &rarr; Data Streams &rarr; Measurement ID.</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pixel_gtm" className="text-xs">Google Tag Manager</Label>
                      <Input
                        id="pixel_gtm"
                        name="pixel_gtm"
                        type="text"
                        placeholder="GTM-XXXXXXX"
                        className="h-8 text-sm"
                        value={pixels.pixel_gtm}
                        onChange={(e) => setPixels((prev) => ({ ...prev, pixel_gtm: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in GTM &rarr; Admin &rarr; Container ID.</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pixel_gads" className="text-xs">Google Ads</Label>
                      <Input
                        id="pixel_gads"
                        name="pixel_gads"
                        type="text"
                        placeholder="AW-XXXXXXXXX/conversion_label"
                        className="h-8 text-sm"
                        value={pixels.pixel_gads}
                        onChange={(e) => setPixels((prev) => ({ ...prev, pixel_gads: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in Google Ads &rarr; Goals &rarr; Conversions &rarr; Conversion ID/label.</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pixel_tiktok" className="text-xs">TikTok Pixel</Label>
                      <Input
                        id="pixel_tiktok"
                        name="pixel_tiktok"
                        type="text"
                        placeholder="CXXXXXXXXXXXXXXX"
                        className="h-8 text-sm"
                        value={pixels.pixel_tiktok}
                        onChange={(e) => setPixels((prev) => ({ ...prev, pixel_tiktok: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in TikTok Ads Manager &rarr; Assets &rarr; Events &rarr; Pixel ID.</p>
                    </div>
                  </div>
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
