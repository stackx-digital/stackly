'use server'

import { revalidatePath } from 'next/cache'
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

  if (!isValidUrl(destinationUrl)) {
    return { error: 'Please enter a valid URL' }
  }

  if (isPrivateUrl(destinationUrl)) {
    return { error: 'Private or local URLs are not allowed' }
  }

  const { error } = await supabase
    .from('links')
    .update({
      destination_url: destinationUrl,
      title,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      utm_content: utmContent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', linkId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  return { success: true }
}
