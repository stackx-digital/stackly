import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/plans'
import { formatNumber, formatDate, truncate } from '@/lib/utils'
import Link from 'next/link'
import { Link2, MousePointerClick, Users, TrendingUp, Plus, ArrowRight, ExternalLink } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    linksResult,
    subscriptionResult,
    totalLinksResult,
  ] = await Promise.all([
    supabase
      .from('links')
      .select('id, slug, destination_url, title, created_at, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  const links = linksResult.data || []
  const plan = (subscriptionResult.data?.plan || 'free') as keyof typeof PLANS
  const planConfig = PLANS[plan]
  const linkLimit = planConfig.linkLimit
  const totalLinks = totalLinksResult.count || 0

  // Get per-link click counts from link_click_summary view
  const linkIds = links.map(l => l.id)
  const [clickSummaryResult, totalClicksResult, uniqueClicksResult] = await Promise.all([
    linkIds.length > 0
      ? supabase
          .from('link_click_summary')
          .select('link_id, total_clicks, unique_clicks')
          .in('link_id', linkIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .in(
        'link_id',
        (await supabase.from('links').select('id').eq('user_id', user.id)).data?.map(l => l.id) || []
      )
      .gte('timestamp', thirtyDaysAgo),
    supabase
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .in(
        'link_id',
        (await supabase.from('links').select('id').eq('user_id', user.id)).data?.map(l => l.id) || []
      )
      .eq('is_unique', true)
      .gte('timestamp', thirtyDaysAgo),
  ])

  const clickSummaryMap = new Map(
    (clickSummaryResult.data || []).map(row => [row.link_id, row])
  )
  const totalClicks30d = totalClicksResult.count || 0
  const uniqueClicks30d = uniqueClicksResult.count || 0

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'

  // Determine greeting
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const firstName = profile?.full_name?.split(' ')[0] || null

  const showUpgradeBanner = plan === 'free' && totalLinks >= 15

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {firstName ? `Good day, ${firstName}!` : 'Welcome back!'}
          </h2>
          <p className="text-muted-foreground mt-1">
            Here&apos;s a summary of your link performance.
          </p>
        </div>
        <Link href="/dashboard/links">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Link
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalLinks)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {linkLimit === Infinity
                ? 'Unlimited on your plan'
                : `${totalLinks} of ${linkLimit} used`}
            </p>
            {linkLimit !== Infinity && (
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min((totalLinks / (linkLimit as number)) * 100, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Clicks (30d) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalClicks30d)}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        {/* Unique Clicks (30d) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Clicks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(uniqueClicks30d)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalClicks30d > 0
                ? `${Math.round((uniqueClicks30d / totalClicks30d) * 100)}% unique rate`
                : 'Last 30 days'}
            </p>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold capitalize">{plan}</div>
              <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize text-xs">
                {subscriptionResult.data?.status || 'active'}
              </Badge>
            </div>
            {plan === 'free' ? (
              <Link href="/dashboard/billing" className="text-xs text-primary hover:underline mt-1 block">
                Upgrade for unlimited links →
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">{planConfig.name} features unlocked</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Links Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Links</CardTitle>
            <CardDescription>Your most recently created short links</CardDescription>
          </div>
          <Link href="/dashboard/links">
            <Button variant="ghost" size="sm" className="gap-1 text-sm">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Link2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1">No links yet</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                Create your first short link and start tracking clicks in real time.
              </p>
              <Link href="/dashboard/links">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create your first link
                </Button>
              </Link>
            </div>
          ) : (
            /* Table layout */
            <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left font-medium text-muted-foreground">Short URL</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Destination</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground hidden md:table-cell">Clicks</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground hidden lg:table-cell">Created</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {links.map((link) => {
                    const summary = clickSummaryMap.get(link.id)
                    const clickCount = summary?.total_clicks ?? 0
                    return (
                      <tr key={link.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-foreground truncate">
                              {baseUrl}/{link.slug}
                            </span>
                            <a
                              href={`${baseUrl}/${link.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          <span className="text-muted-foreground">
                            {truncate(link.destination_url, 40)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right hidden md:table-cell">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {formatNumber(clickCount)}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                          {formatDate(link.created_at)}
                        </td>
                        <td className="py-3 text-right">
                          <Badge variant={link.is_active ? 'default' : 'secondary'} className="text-xs">
                            {link.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Banner — only shown when free user has 15+ links */}
      {showUpgradeBanner && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div>
              <p className="font-semibold">You&apos;re approaching your link limit</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                You&apos;ve used {totalLinks} of {linkLimit as number} links on the Free plan.
                Upgrade to Pro for unlimited links and advanced analytics.
              </p>
            </div>
            <Link href="/dashboard/billing" className="shrink-0">
              <Button>Upgrade to Pro</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
