export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min — enough for ~200 links at 1.5s each

import { createAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend'
import { buildHealthAlertHtml } from '@/lib/email/health-alert'

const TIMEOUT_MS = 10_000
const BATCH_SIZE = 20  // concurrent requests per batch
const FROM = process.env.EMAIL_FROM || 'Stackly Alerts <alerts@stackly.my>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'

type HealthStatus = 'healthy' | 'down' | 'redirected'

async function checkUrl(url: string): Promise<{ status: HealthStatus; httpStatus: number | null; error: string | null }> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'Stackly-HealthBot/1.0' },
      })
      clearTimeout(timer)
      if (res.status >= 200 && res.status < 300) return { status: 'healthy', httpStatus: res.status, error: null }
      if (res.status >= 300 && res.status < 400) return { status: 'redirected', httpStatus: res.status, error: null }
      return { status: 'down', httpStatus: res.status, error: null }
    } finally {
      clearTimeout(timer)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const isTimeout = msg.includes('abort') || msg.includes('timeout')
    return { status: 'down', httpStatus: null, error: isTimeout ? 'Request timed out' : msg }
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const resend = getResend()

  // Only check links not checked in the last 50 min (avoids overlap if cron runs early)
  const cutoff = new Date(Date.now() - 50 * 60 * 1000).toISOString()

  const { data: links, error: linksError } = await supabase
    .from('links')
    .select('id, slug, destination_url, title, user_id, health_status')
    .eq('is_active', true)
    .or(`last_health_check_at.is.null,last_health_check_at.lt.${cutoff}`)
    .order('last_health_check_at', { ascending: true, nullsFirst: true })
    .limit(500)

  if (linksError) {
    return Response.json({ error: linksError.message }, { status: 500 })
  }

  if (!links?.length) {
    return Response.json({ success: true, checked: 0, message: 'No links due for check' })
  }

  // Process in batches to avoid overwhelming target servers
  const results: Array<{
    linkId: string
    userId: string
    slug: string
    title: string | null
    destination_url: string
    previousStatus: string
    newStatus: HealthStatus
    httpStatus: number | null
    error: string | null
    changed: boolean
  }> = []

  for (let i = 0; i < links.length; i += BATCH_SIZE) {
    const batch = links.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (link) => {
        const check = await checkUrl(link.destination_url)
        return {
          linkId: link.id,
          userId: link.user_id,
          slug: link.slug,
          title: link.title,
          destination_url: link.destination_url,
          previousStatus: link.health_status,
          newStatus: check.status,
          httpStatus: check.httpStatus,
          error: check.error,
          changed: check.status !== link.health_status,
        }
      })
    )
    results.push(...batchResults)
  }

  const now = new Date().toISOString()

  // Bulk update health_status on links
  for (const r of results) {
    await supabase
      .from('links')
      .update({
        health_status: r.newStatus,
        health_http_status: r.httpStatus,
        last_health_check_at: now,
      })
      .eq('id', r.linkId)
  }

  // Record events for status changes only
  const changedResults = results.filter((r) => r.changed)
  if (changedResults.length > 0) {
    await supabase.from('link_health_events').insert(
      changedResults.map((r) => ({
        link_id: r.linkId,
        status: r.newStatus,
        http_status: r.httpStatus,
        error_message: r.error,
        checked_at: now,
        email_sent: false,
      }))
    )
  }

  // Group newly-down links by user for email alerts
  const newlyDown = results.filter((r) => r.newStatus === 'down' && r.previousStatus !== 'down')

  const byUser = new Map<string, typeof newlyDown>()
  for (const r of newlyDown) {
    const arr = byUser.get(r.userId) || []
    arr.push(r)
    byUser.set(r.userId, arr)
  }

  let emailsSent = 0
  if (byUser.size > 0) {
    // Get user emails
    const userIds = Array.from(byUser.keys())
    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds)

    for (const user of users || []) {
      const downLinks = byUser.get(user.id) || []
      if (!downLinks.length || !user.email) continue

      const userName = user.full_name || user.email.split('@')[0] || 'there'
      const html = buildHealthAlertHtml({
        userName,
        downLinks: downLinks.map((l) => ({
          slug: l.slug,
          title: l.title,
          destination_url: l.destination_url,
          http_status: l.httpStatus,
          error_message: l.error,
        })),
        baseUrl: BASE_URL,
      })

      try {
        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: `⚠️ ${downLinks.length} link${downLinks.length !== 1 ? 's' : ''} down — Stackly Health Alert`,
          html,
        })
        emailsSent++

        // Mark events as emailed
        const linkIds = downLinks.map((l) => l.linkId)
        await supabase
          .from('link_health_events')
          .update({ email_sent: true })
          .in('link_id', linkIds)
          .eq('status', 'down')
          .eq('checked_at', now)
      } catch {
        // log but don't fail the whole run
      }
    }
  }

  const summary = {
    checked: results.length,
    healthy: results.filter((r) => r.newStatus === 'healthy').length,
    down: results.filter((r) => r.newStatus === 'down').length,
    redirected: results.filter((r) => r.newStatus === 'redirected').length,
    statusChanges: changedResults.length,
    alertsSent: emailsSent,
  }

  return Response.json({ success: true, ...summary })
}
