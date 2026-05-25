import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend'
import { buildWeeklyReportHtml } from '@/lib/email/weekly-report'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const resend = getResend()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'
  const from = process.env.EMAIL_FROM || 'Stackly Reports <reports@stackly.my>'

  const { data: profile } = await adminSupabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const { data: links } = await adminSupabase
    .from('links')
    .select('id, slug, title, destination_url')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(5)

  const topLinks = (links || []).map((l) => ({ ...l, clicks: Math.floor(Math.random() * 120) + 5 }))
    .sort((a, b) => b.clicks - a.clicks)

  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const totalClicks = topLinks.reduce((s, l) => s + l.clicks, 0)
  const userName = profile?.full_name || user.email?.split('@')[0] || 'there'
  const userEmail = profile?.email || user.email || ''

  const html = buildWeeklyReportHtml({
    userName,
    userEmail,
    totalClicks,
    uniqueClicks: Math.floor(totalClicks * 0.7),
    lastWeekTotal: Math.floor(totalClicks * 0.85),
    topLinks,
    weekStart,
    weekEnd: now,
    baseUrl,
  })

  const { error } = await resend.emails.send({
    from,
    to: userEmail,
    subject: `[Test] Your Stackly weekly report — ${totalClicks} clicks this week`,
    html,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
