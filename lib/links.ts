import { createClient } from '@/lib/supabase/server'

export function generateSlug(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1',
  '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
  '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
  '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
]

export function isPrivateUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return BLOCKED_HOSTS.some(h => hostname === h || hostname.startsWith(h))
  } catch {
    return true
  }
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.from('links').select('id').eq('slug', slug).single()
  return !data
}
