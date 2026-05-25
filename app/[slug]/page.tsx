import { redirect, notFound } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { UAParser } from 'ua-parser-js'
import crypto from 'crypto'
import { PixelRedirect } from '@/components/pixel-redirect'
import { PasswordGate } from '@/components/password-gate'

async function getGeoInfo(ip: string): Promise<{ country?: string }> {
  try {
    const geoUrl = process.env.GEOIP_API_URL || 'http://ip-api.com/json'
    const res = await fetch(`${geoUrl}/${ip}?fields=countryCode`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return {}
    const data = await res.json()
    return { country: data.countryCode || undefined }
  } catch {
    return {}
  }
}

function buildRedirectUrl(
  baseUrl: string,
  link: {
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
    utm_term?: string | null
    utm_content?: string | null
  }
): string {
  const url = new URL(baseUrl)
  if (link.utm_source) url.searchParams.set('utm_source', link.utm_source)
  if (link.utm_medium) url.searchParams.set('utm_medium', link.utm_medium)
  if (link.utm_campaign) url.searchParams.set('utm_campaign', link.utm_campaign)
  if (link.utm_term) url.searchParams.set('utm_term', link.utm_term)
  if (link.utm_content) url.searchParams.set('utm_content', link.utm_content)
  return url.toString()
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { slug } = params
  const supabase = await createClient()

  // Feature B: Capture incoming UTM params from the click URL
  const incomingUtm = {
    utm_source: typeof searchParams.utm_source === 'string' ? searchParams.utm_source : null,
    utm_medium: typeof searchParams.utm_medium === 'string' ? searchParams.utm_medium : null,
    utm_campaign: typeof searchParams.utm_campaign === 'string' ? searchParams.utm_campaign : null,
    utm_term: typeof searchParams.utm_term === 'string' ? searchParams.utm_term : null,
    utm_content: typeof searchParams.utm_content === 'string' ? searchParams.utm_content : null,
  }

  // Fetch link with all fields including new enhancements
  const { data: link } = await supabase
    .from('links')
    .select('id, destination_url, is_active, expires_at, utm_source, utm_medium, utm_campaign, utm_term, utm_content, pixel_fb, pixel_ga, pixel_gtm, pixel_gads, pixel_tiktok, active_from, password_hash, redirect_mobile, redirect_tablet, geo_rules')
    .eq('slug', slug)
    .single()

  if (!link || !link.is_active) {
    notFound()
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    notFound()
  }

  // Scheduling: not yet active
  if (link.active_from && new Date(link.active_from) > new Date()) {
    notFound()
  }

  // Password protection
  if (link.password_hash) {
    const cookieStore = await cookies()
    const verified = cookieStore.get(`pw-${link.id}`)?.value === link.password_hash
    if (!verified) {
      return <PasswordGate linkId={link.id} slug={slug} />
    }
  }

  // Track the click asynchronously - don't block redirect
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ip = forwarded?.split(',')[0].trim() || realIp || '0.0.0.0'
  const referrer = headersList.get('referer') || null

  // Hash the IP for privacy
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)

  // Parse user agent
  const parser = new UAParser(userAgent)
  const deviceType = parser.getDevice().type
  const browser = parser.getBrowser().name || null
  const os = parser.getOS().name || null

  let device: 'mobile' | 'desktop' | 'tablet' | 'unknown' = 'unknown'
  if (deviceType === 'mobile') device = 'mobile'
  else if (deviceType === 'tablet') device = 'tablet'
  else if (!deviceType) device = 'desktop'

  // Check if unique (no prior click with same IP hash in last 24h)
  const { data: recentClick } = await supabase
    .from('clicks')
    .select('id')
    .eq('link_id', link.id)
    .eq('ip_hash', ipHash)
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1)
    .single()

  const isUnique = !recentClick

  // Get geo info
  const geo = await getGeoInfo(ip)

  // Insert click record with both incoming UTM (Feature B) captured
  await supabase.from('clicks').insert({
    link_id: link.id,
    ip_hash: ipHash,
    country: geo.country || null,
    device,
    browser,
    os,
    referrer: referrer ? referrer.slice(0, 500) : null,
    user_agent: userAgent.slice(0, 500),
    is_unique: isUnique,
    // Incoming UTM (from the click URL - Feature B)
    utm_source: incomingUtm.utm_source,
    utm_medium: incomingUtm.utm_medium,
    utm_campaign: incomingUtm.utm_campaign,
    utm_term: incomingUtm.utm_term,
    utm_content: incomingUtm.utm_content,
  })

  // Determine final destination: geo > device > default
  let finalDestination = link.destination_url

  // Geo routing
  const geoRules: Array<{ country: string; url: string }> = Array.isArray(link.geo_rules) ? link.geo_rules : []
  const geoMatch = geo.country ? geoRules.find((r) => r.country === geo.country) : null
  if (geoMatch?.url) {
    finalDestination = geoMatch.url
  } else if (device === 'mobile' && link.redirect_mobile) {
    finalDestination = link.redirect_mobile
  } else if (device === 'tablet' && link.redirect_tablet) {
    finalDestination = link.redirect_tablet
  }

  const finalUrl = buildRedirectUrl(finalDestination, link)
  const hasPixels = !!(link.pixel_fb || link.pixel_ga || link.pixel_gtm || link.pixel_gads || link.pixel_tiktok)

  if (!hasPixels) {
    redirect(finalUrl)
  }

  return (
    <PixelRedirect
      destinationUrl={finalUrl}
      pixelFb={link.pixel_fb ?? null}
      pixelGa={link.pixel_ga ?? null}
      pixelGtm={link.pixel_gtm ?? null}
      pixelGads={link.pixel_gads ?? null}
      pixelTiktok={link.pixel_tiktok ?? null}
    />
  )
}
