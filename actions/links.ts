'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { generateSlug, isValidUrl, isPrivateUrl, isSlugAvailable } from '@/lib/links'
import { canCreateLink } from '@/lib/planGuard'

export async function createLink(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const destinationUrl = formData.get('destination_url') as string
  const customSlug = formData.get('slug') as string | null
  const title = formData.get('title') as string | null

  if (!destinationUrl) {
    return { error: 'Destination URL is required' }
  }

  if (!isValidUrl(destinationUrl)) {
    return { error: 'Please enter a valid URL starting with http:// or https://' }
  }

  if (isPrivateUrl(destinationUrl)) {
    return { error: 'Private or local URLs are not allowed' }
  }

  const guard = await canCreateLink(user.id)
  if (!guard.allowed) {
    return { error: guard.reason }
  }

  let slug = customSlug?.trim() || ''

  if (slug) {
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return { error: 'Slug can only contain letters, numbers, hyphens, and underscores' }
    }
    const available = await isSlugAvailable(slug)
    if (!available) {
      return { error: 'This custom slug is already taken. Please choose another.' }
    }
  } else {
    let attempts = 0
    do {
      slug = generateSlug()
      attempts++
      if (attempts > 10) {
        return { error: 'Failed to generate a unique slug. Please try again.' }
      }
    } while (!(await isSlugAvailable(slug)))
  }

  const utmSource = (formData.get('utm_source') as string | null)?.trim() || null
  const utmMedium = (formData.get('utm_medium') as string | null)?.trim() || null
  const utmCampaign = (formData.get('utm_campaign') as string | null)?.trim() || null
  const utmTerm = (formData.get('utm_term') as string | null)?.trim() || null
  const utmContent = (formData.get('utm_content') as string | null)?.trim() || null

  const pixelFb = (formData.get('pixel_fb') as string | null)?.trim() || null
  const pixelGa = (formData.get('pixel_ga') as string | null)?.trim() || null
  const pixelGtm = (formData.get('pixel_gtm') as string | null)?.trim() || null
  const pixelGads = (formData.get('pixel_gads') as string | null)?.trim() || null
  const pixelTiktok = (formData.get('pixel_tiktok') as string | null)?.trim() || null

  // Advanced options
  const activeFromRaw = (formData.get('active_from') as string | null)?.trim() || null
  const activeFrom = activeFromRaw ? new Date(activeFromRaw).toISOString() : null

  const passwordInput = (formData.get('password_input') as string | null)?.trim() || null
  const passwordHash = passwordInput
    ? crypto.createHash('sha256').update(passwordInput).digest('hex')
    : null

  const redirectMobile = (formData.get('redirect_mobile') as string | null)?.trim() || null
  const redirectTablet = (formData.get('redirect_tablet') as string | null)?.trim() || null

  const geoRulesRaw = formData.get('geo_rules') as string | null
  let geoRules: Array<{ country: string; url: string }> = []
  if (geoRulesRaw) {
    try {
      geoRules = JSON.parse(geoRulesRaw)
    } catch {
      // ignore parse errors
    }
  }

  const abVariantsRaw = formData.get('ab_variants') as string | null
  let abVariants: Array<{ label: string; url: string; weight: number }> = []
  if (abVariantsRaw) {
    try {
      abVariants = JSON.parse(abVariantsRaw)
    } catch {
      // ignore parse errors
    }
  }

  const { error } = await supabase.from('links').insert({
    user_id: user.id,
    slug,
    destination_url: destinationUrl,
    title: title || null,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_term: utmTerm,
    utm_content: utmContent,
    pixel_fb: pixelFb,
    pixel_ga: pixelGa,
    pixel_gtm: pixelGtm,
    pixel_gads: pixelGads,
    pixel_tiktok: pixelTiktok,
    active_from: activeFrom,
    password_hash: passwordHash,
    redirect_mobile: redirectMobile,
    redirect_tablet: redirectTablet,
    geo_rules: geoRules,
    ab_variants: abVariants,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  return { success: true, slug }
}

export async function deleteLink(linkId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('links')
    .update({ is_active: false })
    .eq('id', linkId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getLinks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', data: null }
  }

  const { data, error } = await supabase
    .from('links')
    .select(`
      id,
      slug,
      destination_url,
      title,
      is_active,
      created_at,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      link_click_summary (
        total_clicks,
        unique_clicks
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function updateLink(linkId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const destinationUrl = formData.get('destination_url') as string
  const title = (formData.get('title') as string | null)?.trim() || null
  const expiresAt = (formData.get('expires_at') as string | null)?.trim() || null
  const utmSource = (formData.get('utm_source') as string | null)?.trim() || null
  const utmMedium = (formData.get('utm_medium') as string | null)?.trim() || null
  const utmCampaign = (formData.get('utm_campaign') as string | null)?.trim() || null
  const utmTerm = (formData.get('utm_term') as string | null)?.trim() || null
  const utmContent = (formData.get('utm_content') as string | null)?.trim() || null

  const pixelFb = (formData.get('pixel_fb') as string | null)?.trim() || null
  const pixelGa = (formData.get('pixel_ga') as string | null)?.trim() || null
  const pixelGtm = (formData.get('pixel_gtm') as string | null)?.trim() || null
  const pixelGads = (formData.get('pixel_gads') as string | null)?.trim() || null
  const pixelTiktok = (formData.get('pixel_tiktok') as string | null)?.trim() || null

  // Advanced options
  const activeFromRaw = (formData.get('active_from') as string | null)?.trim() || null
  const activeFrom = activeFromRaw ? new Date(activeFromRaw).toISOString() : null

  const passwordInput = (formData.get('password_input') as string | null)?.trim() || null

  const redirectMobile = (formData.get('redirect_mobile') as string | null)?.trim() || null
  const redirectTablet = (formData.get('redirect_tablet') as string | null)?.trim() || null

  const geoRulesRaw = formData.get('geo_rules') as string | null
  let geoRules: Array<{ country: string; url: string }> = []
  if (geoRulesRaw) {
    try {
      geoRules = JSON.parse(geoRulesRaw)
    } catch {
      // ignore parse errors
    }
  }

  const abVariantsRaw = formData.get('ab_variants') as string | null
  let abVariants: Array<{ label: string; url: string; weight: number }> = []
  if (abVariantsRaw) {
    try {
      abVariants = JSON.parse(abVariantsRaw)
    } catch {
      // ignore parse errors
    }
  }

  if (!isValidUrl(destinationUrl)) {
    return { error: 'Please enter a valid URL' }
  }

  if (isPrivateUrl(destinationUrl)) {
    return { error: 'Private or local URLs are not allowed' }
  }

  // Build update payload — only include password_hash if a new password was provided
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = {
    destination_url: destinationUrl,
    title,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_term: utmTerm,
    utm_content: utmContent,
    pixel_fb: pixelFb,
    pixel_ga: pixelGa,
    pixel_gtm: pixelGtm,
    pixel_gads: pixelGads,
    pixel_tiktok: pixelTiktok,
    active_from: activeFrom,
    redirect_mobile: redirectMobile,
    redirect_tablet: redirectTablet,
    geo_rules: geoRules,
    ab_variants: abVariants,
    updated_at: new Date().toISOString(),
  }

  if (passwordInput) {
    updatePayload.password_hash = crypto.createHash('sha256').update(passwordInput).digest('hex')
  }

  const { error } = await supabase
    .from('links')
    .update(updatePayload)
    .eq('id', linkId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function verifyLinkPassword(linkId: string, formData: FormData) {
  const password = formData.get('password') as string
  if (!password) return { error: 'Password required' }

  const supabase = await createClient()
  const { data: link } = await supabase
    .from('links')
    .select('id, password_hash, slug')
    .eq('id', linkId)
    .single()

  if (!link?.password_hash) return { error: 'Invalid link' }

  const inputHash = crypto.createHash('sha256').update(password).digest('hex')
  if (inputHash !== link.password_hash) return { error: 'Incorrect password' }

  const cookieStore = await cookies()
  cookieStore.set(`pw-${linkId}`, link.password_hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  redirect(`/${link.slug}`)
}

export async function bulkCreateLinks(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', results: [] }

  const csvText = formData.get('csv_data') as string
  if (!csvText?.trim()) return { error: 'No data provided', results: [] }

  const lines = csvText.trim().split('\n').filter((l) => l.trim())
  const results: Array<{ url: string; slug?: string; success: boolean; error?: string }> = []

  const guard = await canCreateLink(user.id)

  for (const line of lines.slice(0, 50)) {
    const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''))
    const destinationUrl = parts[0]
    const title = parts[1] || null
    const customSlug = parts[2] || null

    if (!isValidUrl(destinationUrl)) {
      results.push({ url: destinationUrl, success: false, error: 'Invalid URL' })
      continue
    }
    if (isPrivateUrl(destinationUrl)) {
      results.push({ url: destinationUrl, success: false, error: 'Private URL not allowed' })
      continue
    }
    if (!guard.allowed) {
      results.push({ url: destinationUrl, success: false, error: guard.reason })
      continue
    }

    let slug = customSlug || ''
    if (!slug) {
      let attempts = 0
      do {
        slug = generateSlug()
        attempts++
      } while (!(await isSlugAvailable(slug)) && attempts < 10)
    } else if (!(await isSlugAvailable(slug))) {
      results.push({ url: destinationUrl, success: false, error: `Slug "${slug}" already taken` })
      continue
    }

    const { error } = await supabase.from('links').insert({
      user_id: user.id,
      slug,
      destination_url: destinationUrl,
      title,
      is_active: true,
    })

    results.push({ url: destinationUrl, slug, success: !error, error: error?.message })
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  return { results }
}
