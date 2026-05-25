'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function createWebhook(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = (formData.get('name') as string)?.trim()
  const url = (formData.get('url') as string)?.trim()

  if (!name || !url) return { error: 'Name and URL are required' }
  if (!url.startsWith('https://')) return { error: 'Webhook URL must use HTTPS' }

  const secret = 'whsec_' + crypto.randomBytes(24).toString('hex')

  const { error } = await supabase.from('webhooks').insert({
    user_id: user.id,
    name,
    url,
    secret,
    events: ['click'],
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/webhooks')
  return { success: true }
}

export async function deleteWebhook(webhookId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', webhookId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/webhooks')
  return { success: true }
}

export async function toggleWebhook(webhookId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('webhooks')
    .update({ is_active: isActive })
    .eq('id', webhookId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/webhooks')
  return { success: true }
}
