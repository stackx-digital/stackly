import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { UAParser } from 'ua-parser-js'
import crypto from 'crypto'

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

export default async function SlugPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('links')
    .select('id, destination_url, is_active, expires_at')
    .eq('slug', slug)
    .single()

  if (!link || !link.is_active) {
    notFound()
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    notFound()
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

  // Insert click record
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
  })

  redirect(link.destination_url)
}
