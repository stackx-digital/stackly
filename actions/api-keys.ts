'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function generateApiKey() {
  return 'sk_' + crypto.randomBytes(32).toString('hex')
}

export async function createApiKey(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required' }

  // Check max 10 keys per user
  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count || 0) >= 10) return { error: 'Maximum 10 API keys allowed' }

  const rawKey = generateApiKey()
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const keyPreview = rawKey.slice(-4)

  const { error } = await supabase.from('api_keys').insert({
    user_id: user.id,
    name,
    key_hash: keyHash,
    key_preview: keyPreview,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/api')
  return { success: true, key: rawKey } // Only returned once!
}

export async function deleteApiKey(keyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/api')
  return { success: true }
}
