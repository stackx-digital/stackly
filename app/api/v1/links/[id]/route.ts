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
  const { data: apiKey } = await supabase.from('api_keys').select('id, user_id').eq('key_hash', keyHash).single()
  if (!apiKey) return null
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id)
  return apiKey.user_id
}

// GET /api/v1/links/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await authenticateRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('links')
    .select('id, slug, destination_url, title, is_active, created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'
  return NextResponse.json({ ...data, short_url: `${baseUrl}/${data.slug}` })
}

// DELETE /api/v1/links/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await authenticateRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('links')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
