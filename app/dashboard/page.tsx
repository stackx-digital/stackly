import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber, formatDate } from '@/lib/utils'
import { PLANS } from '@/lib/plans'
import Link from 'next/link'
import { Link2, MousePointerClick, TrendingUp, Plus, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [linksResult, clicksResult, subscriptionResult] = await Promise.all([
    supabase
      .from('links')
      .select('id, slug, destination_url, title, created_at, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('clicks')
      .select('id, timestamp', { count: 'exact' })
      .in(
        'link_id',
        (await supabase.from('links').select('id').eq('user_id', user.id)).data?.map(l => l.id) || []
      )
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single(),
  ])

  const links = linksResult.data || []
  const totalClicks30d = clicksResult.count || 0
  const plan = (subscriptionResult.data?.plan || 'free') as keyof typeof PLANS
  const planConfig = PLANS[plan]
  const linkLimit = planConfig.linkLimit

  const { count: totalLinks } = await supabase
    .from('links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your link performance overview.</p>
        </div>
        <Link href="/dashboard/links">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Link
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalLinks || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {linkLimit === Infinity ? 'Unlimited' : `of ${linkLimit} allowed`} on {planConfig.name} plan
            </p>
            {linkLimit !== Infinity && (
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(((totalLinks || 0) / (linkLimit as number)) * 100, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks (30 days)</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalClicks30d)}</div>
            <p className="text-xs text-muted-foreground">Total clicks in the last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold capitalize">{plan}</div>
              <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize">
                {subscriptionResult.data?.status || 'active'}
              </Badge>
            </div>
            {plan === 'free' && (
              <Link href="/dashboard/billing" className="text-xs text-primary hover:underline">
                Upgrade to Pro for unlimited links →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Links</CardTitle>
            <CardDescription>Your most recently created links</CardDescription>
          </div>
          <Link href="/dashboard/links">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No links yet. Create your first link!</p>
              <Link href="/dashboard/links">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Link
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'}/{link.slug}
                      </span>
                      <Badge variant="secondary" className="text-xs">active</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-xs">
                      {link.title || link.destination_url}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap pl-4">
                    {formatDate(link.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Banner for Free Users */}
      {plan === 'free' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <p className="font-semibold">Unlock unlimited links and advanced analytics</p>
              <p className="text-sm text-muted-foreground">Upgrade to Pro for just RM 29/month</p>
            </div>
            <Link href="/dashboard/billing">
              <Button>Upgrade to Pro</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
