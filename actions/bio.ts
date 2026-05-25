'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getBioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('bio_pages')
    .select('*, bio_links(*)')
    .eq('user_id', user.id)
    .order('position', { referencedTable: 'bio_links', ascending: true })
    .single()

  return data
}

export async function upsertBioPage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const title = (formData.get('title') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const theme = (formData.get('theme') as string) || 'violet'

  if (!username || !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    return { error: 'Username must be 3-30 characters (letters, numbers, _ or -)' }
  }

  // Check username conflict (excluding own page)
  const { data: existing } = await supabase
    .from('bio_pages')
    .select('id, user_id')
    .eq('username', username)
    .single()

  if (existing && existing.user_id !== user.id) {
    return { error: 'Username already taken' }
  }

  const { data: page, error } = await supabase
    .from('bio_pages')
    .upsert({ user_id: user.id, username, title, description, theme }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bio')
  revalidatePath(`/u/${username}`)
  return { success: true, page }
}

export async function addBioLink(bioPageId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const url = (formData.get('url') as string)?.trim()

  if (!title || !url) return { error: 'Title and URL are required' }
  if (!url.startsWith('http://') && !url.startsWith('https://')) return { error: 'URL must start with http:// or https://' }

  // Get max position
  const { data: links } = await supabase
    .from('bio_links')
    .select('position')
    .eq('bio_page_id', bioPageId)
    .order('position', { ascending: false })
    .limit(1)

  const position = (links?.[0]?.position ?? -1) + 1

  const { error } = await supabase
    .from('bio_links')
    .insert({ bio_page_id: bioPageId, title, url, position })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bio')
  return { success: true }
}

export async function deleteBioLink(linkId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify ownership via bio_pages
  const { data: ownedPages } = await supabase
    .from('bio_pages')
    .select('id')
    .eq('user_id', user.id)

  const pageIds = (ownedPages || []).map(p => p.id)
  if (pageIds.length === 0) return { error: 'Not found' }

  const { error } = await supabase
    .from('bio_links')
    .delete()
    .eq('id', linkId)
    .in('bio_page_id', pageIds)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/bio')
  return { success: true }
}

export async function toggleBioLink(linkId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('bio_links')
    .update({ is_active: isActive })
    .eq('id', linkId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/bio')
  return { success: true }
}
