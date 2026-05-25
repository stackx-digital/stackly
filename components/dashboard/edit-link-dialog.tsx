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
  pixel_fb: string | null
  pixel_ga: string | null
  pixel_gtm: string | null
  pixel_gads: string | null
  pixel_tiktok: string | null
  active_from: string | null
  redirect_mobile: string | null
  redirect_tablet: string | null
  geo_rules: unknown
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

function parseGeoRules(raw: unknown): Array<{ country: string; url: string }> {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as Array<{ country: string; url: string }>
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
}

export function EditLinkDialog({ link, open, onOpenChange }: EditLinkDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUtm, setShowUtm] = useState(
    !!(link.utm_source || link.utm_medium || link.utm_campaign || link.utm_term || link.utm_content)
  )
  const [showPixel, setShowPixel] = useState(
    !!(link.pixel_fb || link.pixel_ga || link.pixel_gtm || link.pixel_gads || link.pixel_tiktok)
  )
  const [showAdvanced, setShowAdvanced] = useState(
    !!(link.active_from || link.redirect_mobile || link.redirect_tablet || (link.geo_rules && (link.geo_rules as unknown[]).length > 0))
  )
  const [pixels, setPixels] = useState({
    pixel_fb: link.pixel_fb || '',
    pixel_ga: link.pixel_ga || '',
    pixel_gtm: link.pixel_gtm || '',
    pixel_gads: link.pixel_gads || '',
    pixel_tiktok: link.pixel_tiktok || '',
  })
  const [destinationUrl, setDestinationUrl] = useState(link.destination_url)
  const [utm, setUtm] = useState({
    utm_source: link.utm_source || '',
    utm_medium: link.utm_medium || '',
    utm_campaign: link.utm_campaign || '',
    utm_term: link.utm_term || '',
    utm_content: link.utm_content || '',
  })
  const [geoRules, setGeoRules] = useState<Array<{ country: string; url: string }>>(
    parseGeoRules(link.geo_rules)
  )

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

  const hasUtmParams = Object.values(utm).some((v) => v.trim() !== '')
  const hasPixels = Object.values(pixels).some((v) => v.trim() !== '')
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

            {/* Hidden input to pass serialised geo rules */}
            <input
              type="hidden"
              name="geo_rules"
              value={JSON.stringify(geoRules.filter((r) => r.country && r.url))}
            />

            {/* Advanced Options */}
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
                    <label htmlFor="edit_active_from" className="text-xs font-medium leading-none">Go live on (optional)</label>
                    <input
                      id="edit_active_from"
                      name="active_from"
                      type="datetime-local"
                      defaultValue={toDatetimeLocal(link.active_from)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">Link will return 404 until this time.</p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="edit_password_input" className="text-xs font-medium leading-none">Update password (optional)</label>
                    <input
                      id="edit_password_input"
                      name="password_input"
                      type="password"
                      placeholder="Leave blank to keep existing password"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank to keep the existing password.</p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="edit_redirect_mobile" className="text-xs font-medium leading-none">Mobile Redirect (optional)</label>
                    <input
                      id="edit_redirect_mobile"
                      name="redirect_mobile"
                      type="url"
                      placeholder="https://app.example.com/mobile"
                      defaultValue={link.redirect_mobile || ''}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="edit_redirect_tablet" className="text-xs font-medium leading-none">Tablet Redirect (optional)</label>
                    <input
                      id="edit_redirect_tablet"
                      name="redirect_tablet"
                      type="url"
                      placeholder="https://tablet.example.com"
                      defaultValue={link.redirect_tablet || ''}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  {/* Geo Rules */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium leading-none">Country Redirect Rules (optional)</span>
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

            {/* Pixel Tracking */}
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
                      <Label htmlFor="edit_pixel_fb" className="text-xs">Facebook Pixel ID</Label>
                      <Input
                        id="edit_pixel_fb"
                        name="pixel_fb"
                        type="text"
                        placeholder="123456789012345"
                        className="h-8 text-sm"
                        value={pixels.pixel_fb}
                        onChange={(e) => setPixels((p) => ({ ...p, pixel_fb: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in Meta Events Manager &rarr; Data Sources.</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit_pixel_ga" className="text-xs">Google Analytics 4</Label>
                      <Input
                        id="edit_pixel_ga"
                        name="pixel_ga"
                        type="text"
                        placeholder="G-XXXXXXXXXX"
                        className="h-8 text-sm"
                        value={pixels.pixel_ga}
                        onChange={(e) => setPixels((p) => ({ ...p, pixel_ga: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in GA4 Admin &rarr; Data Streams &rarr; Measurement ID.</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit_pixel_gtm" className="text-xs">Google Tag Manager</Label>
                      <Input
                        id="edit_pixel_gtm"
                        name="pixel_gtm"
                        type="text"
                        placeholder="GTM-XXXXXXX"
                        className="h-8 text-sm"
                        value={pixels.pixel_gtm}
                        onChange={(e) => setPixels((p) => ({ ...p, pixel_gtm: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in GTM &rarr; Admin &rarr; Container ID.</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit_pixel_gads" className="text-xs">Google Ads</Label>
                      <Input
                        id="edit_pixel_gads"
                        name="pixel_gads"
                        type="text"
                        placeholder="AW-XXXXXXXXX/conversion_label"
                        className="h-8 text-sm"
                        value={pixels.pixel_gads}
                        onChange={(e) => setPixels((p) => ({ ...p, pixel_gads: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in Google Ads &rarr; Goals &rarr; Conversions &rarr; Conversion ID/label.</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit_pixel_tiktok" className="text-xs">TikTok Pixel</Label>
                      <Input
                        id="edit_pixel_tiktok"
                        name="pixel_tiktok"
                        type="text"
                        placeholder="CXXXXXXXXXXXXXXX"
                        className="h-8 text-sm"
                        value={pixels.pixel_tiktok}
                        onChange={(e) => setPixels((p) => ({ ...p, pixel_tiktok: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Found in TikTok Ads Manager &rarr; Assets &rarr; Events &rarr; Pixel ID.</p>
                    </div>
                  </div>
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
