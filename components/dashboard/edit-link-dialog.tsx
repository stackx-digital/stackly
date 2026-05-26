'use client'

import { useState } from 'react'
import { updateLink } from '@/actions/links'
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
import { Pencil, FlaskConical, Share2 } from 'lucide-react'
import { ImageUpload } from '@/components/dashboard/image-upload'
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
  ab_variants: unknown
  og_title?: string | null
  og_description?: string | null
  og_image_url?: string | null
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

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

function parseGeoRules(raw: unknown): Array<{ country: string; url: string }> {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as Array<{ country: string; url: string }>
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
  return []
}

interface AbVariant { label: string; url: string; weight: number }
function parseAbVariants(raw: unknown): AbVariant[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as AbVariant[]
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
  return []
}

export function EditLinkDialog({ link, open, onOpenChange }: EditLinkDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [destinationUrl, setDestinationUrl] = useState(link.destination_url)
  const [utm, setUtm] = useState({
    utm_source: link.utm_source || '',
    utm_medium: link.utm_medium || '',
    utm_campaign: link.utm_campaign || '',
    utm_term: link.utm_term || '',
    utm_content: link.utm_content || '',
  })
  const [pixels, setPixels] = useState({
    pixel_fb: link.pixel_fb || '',
    pixel_ga: link.pixel_ga || '',
    pixel_gtm: link.pixel_gtm || '',
    pixel_gads: link.pixel_gads || '',
    pixel_tiktok: link.pixel_tiktok || '',
  })
  const [geoRules, setGeoRules] = useState(parseGeoRules(link.geo_rules))

  const existingVariants = parseAbVariants(link.ab_variants)
  const [abEnabled, setAbEnabled] = useState(existingVariants.length >= 2)
  const [abBUrl, setAbBUrl] = useState(existingVariants[1]?.url || '')
  const [abWeightA, setAbWeightA] = useState(existingVariants[0]?.weight ?? 50)
  const [ogTitle, setOgTitle] = useState(link.og_title ?? '')
  const [ogDescription, setOgDescription] = useState(link.og_description ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(link.og_image_url ?? '')

  const { toast } = useToast()
  const hasUtmParams = Object.values(utm).some((v) => v.trim() !== '')
  const previewUrl = buildPreviewUrl(destinationUrl, utm)

  function addGeoRule() {
    if (geoRules.length < 5) setGeoRules((prev) => [...prev, { country: '', url: '' }])
  }
  function removeGeoRule(idx: number) {
    setGeoRules((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateGeoRule(idx: number, field: 'country' | 'url', value: string) {
    setGeoRules((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            Edit Link
          </SheetTitle>
          <SheetDescription>
            Editing <span className="font-mono text-xs text-foreground">{(process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://stackly-wheat.vercel.app')).replace(/https?:\/\//, '')}/{link.slug}</span>
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
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
                <TabsTrigger value="preview" className="flex-1">
                  <Share2 className="h-3.5 w-3.5 mr-1" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
              </TabsList>

              {/* ── BASIC TAB ── */}
              <TabsContent value="basic" forceMount className="space-y-5 mt-0 data-[state=inactive]:hidden">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Short URL (read-only)</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-mono text-muted-foreground">
                    {(process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://stackly-wheat.vercel.app')).replace(/https?:\/\//, '')}/{link.slug}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_dest">Destination URL <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit_dest" name="destination_url" type="url" required
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_title">Title <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Input id="edit_title" name="title" type="text" defaultValue={link.title || ''} placeholder="e.g. Shopee Campaign" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_expires">Expiry date <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <input
                    id="edit_expires" name="expires_at" type="datetime-local"
                    defaultValue={toDatetimeLocal(link.expires_at)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">Link returns 404 after this date. Leave empty for no expiry.</p>
                </div>

                {/* A/B Split Test */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">A/B Split Test</p>
                      <p className="text-xs text-muted-foreground">Split traffic between two URLs</p>
                    </div>
                    <input
                      type="checkbox"
                      id="edit_ab_enabled"
                      checked={abEnabled}
                      onChange={(e) => setAbEnabled(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                  </div>

                  {abEnabled && (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Variant A (current destination)</label>
                        <div className="h-8 rounded-md border bg-muted px-3 flex items-center text-xs font-mono text-muted-foreground truncate">
                          {destinationUrl}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="edit_ab_b_url" className="text-xs font-medium">Variant B URL</label>
                        <Input
                          id="edit_ab_b_url" type="url" placeholder="https://landing-page-b.com"
                          value={abBUrl} onChange={(e) => setAbBUrl(e.target.value)} className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Traffic split</span>
                          <span className="text-muted-foreground">A: <strong>{abWeightA}%</strong> · B: <strong>{100 - abWeightA}%</strong></span>
                        </div>
                        <input
                          type="range" min={10} max={90} step={5}
                          value={abWeightA} onChange={(e) => setAbWeightA(Number(e.target.value))}
                          className="w-full accent-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── TRACKING TAB ── */}
              <TabsContent value="tracking" forceMount className="space-y-6 mt-0 data-[state=inactive]:hidden">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">UTM Parameters</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Appended to destination URL on every redirect.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="e_utm_source" className="text-xs">Source</Label>
                      <Input id="e_utm_source" name="utm_source" placeholder="facebook" className="h-8 text-sm"
                        value={utm.utm_source} onChange={(e) => setUtm((p) => ({ ...p, utm_source: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e_utm_medium" className="text-xs">Medium</Label>
                      <Input id="e_utm_medium" name="utm_medium" placeholder="social" className="h-8 text-sm"
                        value={utm.utm_medium} onChange={(e) => setUtm((p) => ({ ...p, utm_medium: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e_utm_campaign" className="text-xs">Campaign</Label>
                      <Input id="e_utm_campaign" name="utm_campaign" placeholder="raya2026" className="h-8 text-sm"
                        value={utm.utm_campaign} onChange={(e) => setUtm((p) => ({ ...p, utm_campaign: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e_utm_term" className="text-xs">Term</Label>
                      <Input id="e_utm_term" name="utm_term" placeholder="keyword" className="h-8 text-sm"
                        value={utm.utm_term} onChange={(e) => setUtm((p) => ({ ...p, utm_term: e.target.value }))} />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label htmlFor="e_utm_content" className="text-xs">Content</Label>
                      <Input id="e_utm_content" name="utm_content" placeholder="banner_ad" className="h-8 text-sm"
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
                      <Label htmlFor="e_pixel_fb" className="text-xs">Facebook Pixel ID</Label>
                      <Input id="e_pixel_fb" name="pixel_fb" placeholder="123456789012345" className="h-8 text-sm"
                        value={pixels.pixel_fb} onChange={(e) => setPixels((p) => ({ ...p, pixel_fb: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e_pixel_ga" className="text-xs">Google Analytics 4</Label>
                      <Input id="e_pixel_ga" name="pixel_ga" placeholder="G-XXXXXXXXXX" className="h-8 text-sm"
                        value={pixels.pixel_ga} onChange={(e) => setPixels((p) => ({ ...p, pixel_ga: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e_pixel_gtm" className="text-xs">Google Tag Manager</Label>
                      <Input id="e_pixel_gtm" name="pixel_gtm" placeholder="GTM-XXXXXXX" className="h-8 text-sm"
                        value={pixels.pixel_gtm} onChange={(e) => setPixels((p) => ({ ...p, pixel_gtm: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e_pixel_gads" className="text-xs">Google Ads</Label>
                      <Input id="e_pixel_gads" name="pixel_gads" placeholder="AW-XXXXXXXXX/label" className="h-8 text-sm"
                        value={pixels.pixel_gads} onChange={(e) => setPixels((p) => ({ ...p, pixel_gads: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e_pixel_tiktok" className="text-xs">TikTok Pixel</Label>
                      <Input id="e_pixel_tiktok" name="pixel_tiktok" placeholder="CXXXXXXXXXXXXXXX" className="h-8 text-sm"
                        value={pixels.pixel_tiktok} onChange={(e) => setPixels((p) => ({ ...p, pixel_tiktok: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── PREVIEW TAB ── */}
              <TabsContent value="preview" forceMount className="space-y-5 mt-0 data-[state=inactive]:hidden">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Social Preview</p>
                  <p className="text-xs text-muted-foreground">
                    Customise how your link looks when shared on WhatsApp, Telegram, Facebook, and Twitter.
                    If left empty, the destination site&apos;s own preview is used.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_og_title" className="text-sm">Preview Title</Label>
                  <Input
                    id="edit_og_title" name="og_title"
                    placeholder="e.g. 🔥 Raya Sale — Up to 70% Off"
                    value={ogTitle} onChange={(e) => setOgTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_og_description" className="text-sm">Preview Description</Label>
                  <textarea
                    id="edit_og_description" name="og_description"
                    placeholder="Short description shown under the title…"
                    rows={2}
                    value={ogDescription} onChange={(e) => setOgDescription(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Preview Image</Label>
                  <ImageUpload
                    value={ogImageUrl}
                    onChange={setOgImageUrl}
                    inputName="og_image_url"
                  />
                </div>

                {ogTitle && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">WhatsApp Preview</p>
                    <div className="rounded-xl border bg-[#f0f2f5] p-3">
                      <div className="rounded-lg overflow-hidden bg-white shadow-sm border">
                        {ogImageUrl && (
                          <img src={ogImageUrl} alt="" className="w-full h-36 object-cover" />
                        )}
                        <div className="p-3 space-y-0.5">
                          <p className="text-sm font-semibold leading-tight line-clamp-2">{ogTitle}</p>
                          {ogDescription && <p className="text-xs text-muted-foreground line-clamp-2">{ogDescription}</p>}
                          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide pt-0.5">
                            {typeof window !== 'undefined' ? window.location.hostname : 'stackly'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── ADVANCED TAB ── */}
              <TabsContent value="advanced" forceMount className="space-y-5 mt-0 data-[state=inactive]:hidden">
                <div className="space-y-1">
                  <Label htmlFor="edit_active_from" className="text-sm">Go live on <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <input
                    id="edit_active_from" name="active_from" type="datetime-local"
                    defaultValue={toDatetimeLocal(link.active_from)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">Link returns 404 until this date/time.</p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit_password_input" className="text-sm">Update password <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <input
                    id="edit_password_input" name="password_input" type="password"
                    placeholder="Leave blank to keep existing password"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit_redirect_mobile" className="text-sm">Mobile redirect</Label>
                    <input
                      id="edit_redirect_mobile" name="redirect_mobile" type="url"
                      placeholder="https://app.example.com"
                      defaultValue={link.redirect_mobile || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit_redirect_tablet" className="text-sm">Tablet redirect</Label>
                    <input
                      id="edit_redirect_tablet" name="redirect_tablet" type="url"
                      placeholder="https://tablet.example.com"
                      defaultValue={link.redirect_tablet || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Country Redirect Rules</Label>
                    {geoRules.length < 5 && (
                      <button type="button" onClick={addGeoRule} className="text-xs text-primary hover:underline">+ Add Rule</button>
                    )}
                  </div>
                  {geoRules.length === 0 && (
                    <p className="text-xs text-muted-foreground">No rules. Redirect specific countries to a different URL.</p>
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
                      <button type="button" onClick={() => removeGeoRule(idx)} className="text-xs text-destructive hover:underline shrink-0">Remove</button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save changes'}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
