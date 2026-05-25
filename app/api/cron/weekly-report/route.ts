export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend'
import { buildWeeklyReportHtml } from '@/lib/email/weekly-report'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const resend = getResend()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'
  const from = process.env.EMAIL_FROM || 'Stackly Reports <reports@stackly.my>'

  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const prevWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name')

  if (usersError || !users?.length) {
    return Response.json({ error: usersError?.message || 'No users', sent: 0 })
  }

  let sent = 0
  const errors: string[] = []

  for (const user of users) {
    try {
      // Get user's active links
      const { data: links } = await supabase
        .from('links')
        .select('id, slug, title, destination_url')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (!links?.length) continue

      const linkIds = links.map((l) => l.id)

      // Clicks this week
      const { data: thisWeek } = await supabase
        .from('clicks')
        .select('link_id, is_unique')
        .in('link_id', linkIds)
        .gte('timestamp', weekStart.toISOString())
        .lt('timestamp', now.toISOString())

      // Clicks last week (for comparison)
      const { data: lastWeek } = await supabase
        .from('clicks')
        .select('link_id')
        .in('link_id', linkIds)
        .gte('timestamp', prevWeekStart.toISOString())
        .lt('timestamp', weekStart.toISOString())

      const totalClicks = thisWeek?.length || 0
      if (totalClicks === 0) continue // skip users with no activity

      const uniqueClicks = thisWeek?.filter((c) => c.is_unique).length || 0
      const lastWeekTotal = lastWeek?.length || 0

      // Count per-link clicks
      const clicksByLink: Record<string, number> = {}
      for (const c of thisWeek ?? []) {
        clicksByLink[c.link_id] = (clicksByLink[c.link_id] || 0) + 1
      }

      const topLinks = links
        .map((l) => ({ ...l, clicks: clicksByLink[l.id] || 0 }))
        .filter((l) => l.clicks > 0)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)

      const userName = user.full_name || user.email?.split('@')[0] || 'there'
      const html = buildWeeklyReportHtml({
        userName,
        userEmail: user.email,
        totalClicks,
        uniqueClicks,
        lastWeekTotal,
        topLinks,
        weekStart,
        weekEnd: now,
        baseUrl,
      })

      await resend.emails.send({
        from,
        to: user.email,
        subject: `Your Stackly weekly report — ${totalClicks} click${totalClicks !== 1 ? 's' : ''} this week`,
        html,
      })

      sent++
    } catch (err) {
      errors.push(`${user.email}: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  }

  return Response.json({ success: true, sent, errors: errors.length ? errors : undefined })
}
