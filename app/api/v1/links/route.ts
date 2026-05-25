import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function authenticateRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.slice(7)
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  const supabase = getSupabaseAdmin()
  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', keyHash)
    .single()

  if (!apiKey) return null

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)

  return apiKey.user_id
}

function generateSlug(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// GET /api/v1/links
export async function GET(req: NextRequest) {
  const userId = await authenticateRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  const { data, count, error } = await supabase
    .from('links')
    .select('id, slug, destination_url, title, is_active, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'
  const links = (data || []).map(l => ({ ...l, short_url: `${baseUrl}/${l.slug}` }))

  return NextResponse.json({ data: links, total: count, limit, offset })
}

// POST /api/v1/links
export async function POST(req: NextRequest) {
  const userId = await authenticateRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { url?: string; slug?: string; title?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  try { new URL(body.url) } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  let slug = body.slug?.trim() || ''

  if (slug) {
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug can only contain letters, numbers, - and _' }, { status: 400 })
    }
    const { data: existing } = await supabase.from('links').select('id').eq('slug', slug).single()
    if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
  } else {
    let attempts = 0
    do {
      slug = generateSlug()
      const { data: existing } = await supabase.from('links').select('id').eq('slug', slug).single()
      if (!existing) break
      attempts++
    } while (attempts < 10)
  }

  const { data: link, error } = await supabase
    .from('links')
    .insert({ user_id: userId, slug, destination_url: body.url, title: body.title || null, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'
  return NextResponse.json({ ...link, short_url: `${baseUrl}/${link.slug}` }, { status: 201 })
}
