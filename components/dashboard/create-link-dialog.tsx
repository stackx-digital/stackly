'use client'

import { useState } from 'react'
import { createLink } from '@/actions/links'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Plus, Link2, FlaskConical } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface CreateLinkDialogProps {
  canCreate: boolean
  plan?: string
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CreateLinkDialog({ canCreate, plan: _plan }: CreateLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [destinationUrl, setDestinationUrl] = useState('')
  const [utm, setUtm] = useState({ utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' })
  const [pixels, setPixels] = useState({ pixel_fb: '', pixel_ga: '', pixel_gtm: '', pixel_gads: '', pixel_tiktok: '' })
  const [geoRules, setGeoRules] = useState<Array<{ country: string; url: string }>>([])
  const [abEnabled, setAbEnabled] = useState(false)
  const [abBUrl, setAbBUrl] = useState('')
  const [abWeightA, setAbWeightA] = useState(50)
  const { toast } = useToast()

  const previewUrl = buildPreviewUrl(destinationUrl, utm)
  const hasUtmParams = Object.values(utm).some((v) => v.trim() !== '')

  function addGeoRule() {
    if (geoRules.length < 5) setGeoRules((prev) => [...prev, { country: '', url: '' }])
  }
  function removeGeoRule(idx: number) {
    setGeoRules((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateGeoRule(idx: number, field: 'country' | 'url', value: string) {
    setGeoRules((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  function handleReset() {
    setDestinationUrl('')
    setUtm({ utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' })
    setPixels({ pixel_fb: '', pixel_ga: '', pixel_gtm: '', pixel_gads: '', pixel_tiktok: '' })
    setGeoRules([])
    setAbEnabled(false)
    setAbBUrl('')
    setAbWeightA(50)
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
    toast({ title: 'Link created!', description: 'Your short link is ready to share.' })
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
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Link
      </Button>

      <Sheet open={open} onOpenChange={(val) => { setOpen(val); if (!val) handleReset() }}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Create New Link
            </SheetTitle>
            <SheetDescription>Shorten a URL and start tracking clicks instantly.</SheetDescription>
          </SheetHeader>

          <form action={handleSubmit} className="flex flex-col flex-1 min-h-0">
            {/* Hidden serialised fields */}
            <input type="hidden" name="geo_rules" value={JSON.stringify(geoRules.filter((r) => r.country && r.url))} />
            <input
              type="hidden"
              name="ab_variants"
              value={
                abEnabled && abBUrl.trim()
                  ? JSON.stringify([
                      { label: 'A', url: destinationUrl, weight: abWeightA },
                      { label: 'B', url: abBUrl.trim(), weight: 100 - abWeightA },
                    ])
                  : '[]'
              }
            />

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {error && (
                <div className="mb-4 bg-destructive/10 text-destructive text-sm rounded-md p-3">{error}</div>
              )}

              <Tabs defaultValue="basic">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
                  <TabsTrigger value="tracking" className="flex-1">Tracking</TabsTrigger>
                  <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
                </TabsList>

                {/* ── BASIC TAB ── */}
                <TabsContent value="basic" className="space-y-5 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="destination_url">Destination URL <span className="text-destructive">*</span></Label>
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
                    <Label htmlFor="title">Title <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <Input id="title" name="title" type="text" placeholder="e.g. Shopee Campaign - August 2024" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Custom Slug <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <div className="flex items-center gap-0">
                      <span className="flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
                        stackly.my/
                      </span>
                      <Input
                        id="slug"
                        name="slug"
                        type="text"
                        placeholder="my-link"
                        pattern="[a-zA-Z0-9_-]+"
                        className="rounded-l-none"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Leave empty for a random slug.</p>
                  </div>

                  {/* A/B Split Test — in Basic tab so it's easy to find */}
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">A/B Split Test</p>
                        <p className="text-xs text-muted-foreground">Split traffic between two URLs</p>
                      </div>
                      <input
                        type="checkbox"
                        id="ab_enabled"
                        checked={abEnabled}
                        onChange={(e) => setAbEnabled(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                    </div>

                    {abEnabled && (
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Variant A</label>
                          <div className="h-8 rounded-md border bg-muted px-3 flex items-center text-xs font-mono text-muted-foreground truncate">
                            {destinationUrl || '(fill destination URL above)'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="ab_b_url" className="text-xs font-medium">Variant B URL</label>
                          <Input
                            id="ab_b_url"
                            type="url"
                            placeholder="https://landing-page-b.com"
                            value={abBUrl}
                            onChange={(e) => setAbBUrl(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">Traffic split</span>
                            <span className="text-muted-foreground">A: <strong>{abWeightA}%</strong> · B: <strong>{100 - abWeightA}%</strong></span>
                          </div>
                          <input
                            type="range" min={10} max={90} step={5}
                            value={abWeightA}
                            onChange={(e) => setAbWeightA(Number(e.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ── TRACKING TAB ── */}
                <TabsContent value="tracking" className="space-y-6 mt-0">
                  {/* UTM Parameters */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">UTM Parameters</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Appended to destination URL on every redirect.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="utm_source" className="text-xs">Source</Label>
                        <Input id="utm_source" name="utm_source" placeholder="facebook" className="h-8 text-sm"
                          value={utm.utm_source} onChange={(e) => setUtm((p) => ({ ...p, utm_source: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="utm_medium" className="text-xs">Medium</Label>
                        <Input id="utm_medium" name="utm_medium" placeholder="social" className="h-8 text-sm"
                          value={utm.utm_medium} onChange={(e) => setUtm((p) => ({ ...p, utm_medium: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="utm_campaign" className="text-xs">Campaign</Label>
                        <Input id="utm_campaign" name="utm_campaign" placeholder="raya2026" className="h-8 text-sm"
                          value={utm.utm_campaign} onChange={(e) => setUtm((p) => ({ ...p, utm_campaign: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="utm_term" className="text-xs">Term</Label>
                        <Input id="utm_term" name="utm_term" placeholder="keyword" className="h-8 text-sm"
                          value={utm.utm_term} onChange={(e) => setUtm((p) => ({ ...p, utm_term: e.target.value }))} />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label htmlFor="utm_content" className="text-xs">Content</Label>
                        <Input id="utm_content" name="utm_content" placeholder="banner_ad" className="h-8 text-sm"
                          value={utm.utm_content} onChange={(e) => setUtm((p) => ({ ...p, utm_content: e.target.value }))} />
                      </div>
                    </div>
                    {previewUrl && hasUtmParams && (
                      <div className="rounded-md bg-muted px-3 py-2 break-all text-xs font-mono text-muted-foreground">
                        {previewUrl}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-5 space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Pixel Tracking</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Fires on an intermediate page before redirecting.</p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="pixel_fb" className="text-xs">Facebook Pixel ID</Label>
                        <Input id="pixel_fb" name="pixel_fb" placeholder="123456789012345" className="h-8 text-sm"
                          value={pixels.pixel_fb} onChange={(e) => setPixels((p) => ({ ...p, pixel_fb: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="pixel_ga" className="text-xs">Google Analytics 4 (Measurement ID)</Label>
                        <Input id="pixel_ga" name="pixel_ga" placeholder="G-XXXXXXXXXX" className="h-8 text-sm"
                          value={pixels.pixel_ga} onChange={(e) => setPixels((p) => ({ ...p, pixel_ga: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="pixel_gtm" className="text-xs">Google Tag Manager</Label>
                        <Input id="pixel_gtm" name="pixel_gtm" placeholder="GTM-XXXXXXX" className="h-8 text-sm"
                          value={pixels.pixel_gtm} onChange={(e) => setPixels((p) => ({ ...p, pixel_gtm: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="pixel_gads" className="text-xs">Google Ads</Label>
                        <Input id="pixel_gads" name="pixel_gads" placeholder="AW-XXXXXXXXX/label" className="h-8 text-sm"
                          value={pixels.pixel_gads} onChange={(e) => setPixels((p) => ({ ...p, pixel_gads: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="pixel_tiktok" className="text-xs">TikTok Pixel</Label>
                        <Input id="pixel_tiktok" name="pixel_tiktok" placeholder="CXXXXXXXXXXXXXXX" className="h-8 text-sm"
                          value={pixels.pixel_tiktok} onChange={(e) => setPixels((p) => ({ ...p, pixel_tiktok: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ── ADVANCED TAB ── */}
                <TabsContent value="advanced" className="space-y-5 mt-0">
                  <div className="space-y-1">
                    <Label htmlFor="active_from" className="text-sm">Go live on <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <input
                      id="active_from" name="active_from" type="datetime-local"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">Link returns 404 until this date/time.</p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="password_input" className="text-sm">Password protect <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <input
                      id="password_input" name="password_input" type="password"
                      placeholder="Leave empty for no password"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="redirect_mobile" className="text-sm">Mobile redirect</Label>
                      <input
                        id="redirect_mobile" name="redirect_mobile" type="url"
                        placeholder="https://app.example.com"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="redirect_tablet" className="text-sm">Tablet redirect</Label>
                      <input
                        id="redirect_tablet" name="redirect_tablet" type="url"
                        placeholder="https://tablet.example.com"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Country Redirect Rules</Label>
                      {geoRules.length < 5 && (
                        <button type="button" onClick={addGeoRule} className="text-xs text-primary hover:underline">
                          + Add Rule
                        </button>
                      )}
                    </div>
                    {geoRules.length === 0 && (
                      <p className="text-xs text-muted-foreground">No rules yet. Redirect specific countries to a different URL.</p>
                    )}
                    {geoRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text" placeholder="MY" maxLength={2}
                          value={rule.country}
                          onChange={(e) => updateGeoRule(idx, 'country', e.target.value.toUpperCase())}
                          className="flex h-9 w-14 rounded-md border border-input bg-background px-2 text-xs uppercase shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <input
                          type="url" placeholder="https://shopee.my"
                          value={rule.url}
                          onChange={(e) => updateGeoRule(idx, 'url', e.target.value)}
                          className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <button type="button" onClick={() => removeGeoRule(idx)} className="text-xs text-destructive hover:underline shrink-0">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Link'}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
