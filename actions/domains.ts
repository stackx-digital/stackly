'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

function makeToken(userId: string, domain: string) {
  return crypto
    .createHmac('sha256', process.env.CRON_SECRET || 'stackly-domain-secret')
    .update(`${userId}:${domain}`)
    .digest('hex')
    .slice(0, 24)
}

export async function addCustomDomain(domain: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const cleaned = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (!/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(cleaned)) {
    return { error: 'Invalid domain format (e.g. go.yourbrand.com)' }
  }

  const token = makeToken(user.id, cleaned)

  const { error } = await supabase
    .from('custom_domains')
    .insert({ user_id: user.id, domain: cleaned, verification_token: token, status: 'pending' })

  if (error) {
    if (error.code === '23505') return { error: 'This domain is already registered.' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/domains')
  return { success: true }
}

export async function verifyCustomDomain(domainId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: record } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('id', domainId)
    .eq('user_id', user.id)
    .single()

  if (!record) return { error: 'Domain not found' }

  try {
    const dns = await import('dns/promises')
    const txtRecords = await dns.resolveTxt(`_stackly-verify.${record.domain}`)
    const expected = `stackly-${record.verification_token}`
    if (!txtRecords.flat().includes(expected)) {
      return { error: 'TXT record not found or value incorrect. Check your DNS settings and try again.' }
    }
  } catch {
    return { error: 'Could not resolve TXT record. DNS may still be propagating (up to 24 hours).' }
  }

  // Optionally add to Vercel automatically
  if (process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID) {
    try {
      const res = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: record.domain }),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('Vercel add domain error:', body)
      }
    } catch (e) {
      console.error('Vercel API call failed:', e)
    }
  }

  const { error } = await supabase
    .from('custom_domains')
    .update({ status: 'active', verified_at: new Date().toISOString() })
    .eq('id', domainId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/domains')
  return { success: true }
}

export async function deleteCustomDomain(domainId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('custom_domains')
    .delete()
    .eq('id', domainId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/domains')
  return { success: true }
}

export async function getActiveDomain(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('custom_domains')
    .select('domain')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  return data?.domain ?? null
}
