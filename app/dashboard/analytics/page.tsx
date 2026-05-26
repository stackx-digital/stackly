import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUserPlan, canAccessAdvancedAnalytics } from '@/lib/planGuard'
import { formatNumber } from '@/lib/utils'
import { BarChart3, MousePointerClick, Globe, Smartphone, TrendingUp, Tag } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WorldMap } from '@/components/dashboard/world-map'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { link?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [plan, hasAdvanced] = await Promise.all([
    getUserPlan(user.id),
    canAccessAdvancedAnalytics(user.id),
  ])

  // Get all user links for the dropdown
  const { data: links } = await supabase
    .from('links')
    .select('id, slug, title, destination_url')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const selectedLinkId = searchParams.link || links?.[0]?.id

  // Get click stats for selected link
  let clickStats = null
  let countryStats: { country: string; count: number }[] = []
  let allCountryStats: { country: string; count: number }[] = []
  let deviceStats: { device: string; count: number }[] = []
  let browserStats: { browser: string; count: number }[] = []
  let utmSourceStats: { utm_source: string; count: number }[] = []
  let utmMediumStats: { utm_medium: string; count: number }[] = []
  let utmCampaignStats: { utm_campaign: string; count: number }[] = []

  if (selectedLinkId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [totalResult, uniqueResult] = await Promise.all([
      supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true })
        .eq('link_id', selectedLinkId)
        .gte('timestamp', thirtyDaysAgo),
      supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true })
        .eq('link_id', selectedLinkId)
        .eq('is_unique', true)
        .gte('timestamp', thirtyDaysAgo),
    ])

    clickStats = {
      total: totalResult.count || 0,
      unique: uniqueResult.count || 0,
    }

    if (hasAdvanced) {
      const [countryResult, deviceResult, browserResult, utmSourceResult, utmMediumResult, utmCampaignResult] = await Promise.all([
        supabase
          .from('clicks')
          .select('country')
          .eq('link_id', selectedLinkId)
          .gte('timestamp', thirtyDaysAgo)
          .not('country', 'is', null),
        supabase
          .from('clicks')
          .select('device')
          .eq('link_id', selectedLinkId)
          .gte('timestamp', thirtyDaysAgo),
        supabase
          .from('clicks')
          .select('browser')
          .eq('link_id', selectedLinkId)
          .gte('timestamp', thirtyDaysAgo)
          .not('browser', 'is', null),
        supabase
          .from('clicks')
          .select('utm_source')
          .eq('link_id', selectedLinkId)
          .gte('timestamp', thirtyDaysAgo)
          .not('utm_source', 'is', null),
        supabase
          .from('clicks')
          .select('utm_medium')
          .eq('link_id', selectedLinkId)
          .gte('timestamp', thirtyDaysAgo)
          .not('utm_medium', 'is', null),
        supabase
          .from('clicks')
          .select('utm_campaign')
          .eq('link_id', selectedLinkId)
          .gte('timestamp', thirtyDaysAgo)
          .not('utm_campaign', 'is', null),
      ])

      // Aggregate country stats
      const countryCounts = (countryResult.data || []).reduce((acc: Record<string, number>, row) => {
        if (row.country) {
          acc[row.country] = (acc[row.country] || 0) + 1
        }
        return acc
      }, {})
      allCountryStats = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
      countryStats = allCountryStats.slice(0, 5)

      // Aggregate device stats
      const deviceCounts = (deviceResult.data || []).reduce((acc: Record<string, number>, row) => {
        const device = row.device || 'unknown'
        acc[device] = (acc[device] || 0) + 1
        return acc
      }, {})
      deviceStats = Object.entries(deviceCounts)
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count)

      // Aggregate browser stats
      const browserCounts = (browserResult.data || []).reduce((acc: Record<string, number>, row) => {
        if (row.browser) {
          acc[row.browser] = (acc[row.browser] || 0) + 1
        }
        return acc
      }, {})
      browserStats = Object.entries(browserCounts)
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Aggregate UTM source stats
      const utmSourceCounts = (utmSourceResult.data || []).reduce((acc: Record<string, number>, row) => {
        if (row.utm_source) {
          acc[row.utm_source] = (acc[row.utm_source] || 0) + 1
        }
        return acc
      }, {})
      utmSourceStats = Object.entries(utmSourceCounts)
        .map(([utm_source, count]) => ({ utm_source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Aggregate UTM medium stats
      const utmMediumCounts = (utmMediumResult.data || []).reduce((acc: Record<string, number>, row) => {
        if (row.utm_medium) {
          acc[row.utm_medium] = (acc[row.utm_medium] || 0) + 1
        }
        return acc
      }, {})
      utmMediumStats = Object.entries(utmMediumCounts)
        .map(([utm_medium, count]) => ({ utm_medium, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Aggregate UTM campaign stats
      const utmCampaignCounts = (utmCampaignResult.data || []).reduce((acc: Record<string, number>, row) => {
        if (row.utm_campaign) {
          acc[row.utm_campaign] = (acc[row.utm_campaign] || 0) + 1
        }
        return acc
      }, {})
      utmCampaignStats = Object.entries(utmCampaignCounts)
        .map(([utm_campaign, count]) => ({ utm_campaign, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }
  }

  const selectedLink = links?.find(l => l.id === selectedLinkId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track performance for your links</p>
        </div>
        <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize">
          {plan} Plan
        </Badge>
      </div>

      {/* Link selector */}
      {links && links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select a Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <Link key={link.id} href={`/dashboard/analytics?link=${link.id}`}>
                  <Badge
                    variant={selectedLinkId === link.id ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-1 px-3"
                  >
                    /{link.slug}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLink && clickStats && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks (30 days)</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(clickStats.total)}</div>
                <p className="text-xs text-muted-foreground">For /{selectedLink.slug}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors (30 days)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(clickStats.unique)}</div>
                <p className="text-xs text-muted-foreground">
                  {clickStats.total > 0
                    ? `${Math.round((clickStats.unique / clickStats.total) * 100)}% unique rate`
                    : 'No clicks yet'}
                </p>
              </CardContent>
            </Card>
          </div>

          {!hasAdvanced && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Unlock Advanced Analytics
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      See country breakdowns, device types, browsers, and more with Pro.
                    </p>
                  </div>
                  <Link href="/dashboard/billing">
                    <Button>Upgrade to Pro</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {hasAdvanced && (utmSourceStats.length > 0 || utmMediumStats.length > 0 || utmCampaignStats.length > 0) && (
            <div className="grid gap-6 md:grid-cols-3">
              {utmSourceStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      UTM Sources
                    </CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {utmSourceStats.map(({ utm_source, count }) => (
                        <div key={utm_source} className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate max-w-[120px]">{utm_source}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-primary rounded-full" style={{
                              width: `${Math.max(8, (count / utmSourceStats[0].count) * 80)}px`
                            }} />
                            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {utmMediumStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      UTM Mediums
                    </CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {utmMediumStats.map(({ utm_medium, count }) => (
                        <div key={utm_medium} className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate max-w-[120px]">{utm_medium}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-primary rounded-full" style={{
                              width: `${Math.max(8, (count / utmMediumStats[0].count) * 80)}px`
                            }} />
                            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {utmCampaignStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      UTM Campaigns
                    </CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {utmCampaignStats.map(({ utm_campaign, count }) => (
                        <div key={utm_campaign} className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate max-w-[120px]">{utm_campaign}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-primary rounded-full" style={{
                              width: `${Math.max(8, (count / utmCampaignStats[0].count) * 80)}px`
                            }} />
                            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {hasAdvanced && allCountryStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Click Locations
                </CardTitle>
                <CardDescription>Geographic distribution of clicks in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <WorldMap countryStats={allCountryStats} />
              </CardContent>
            </Card>
          )}

          {hasAdvanced && (
            <div className="grid gap-6 md:grid-cols-3">
              {countryStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Top Countries
                    </CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {countryStats.map(({ country, count }) => (
                        <div key={country} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{country || 'Unknown'}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-primary rounded-full" style={{
                              width: `${Math.max(8, (count / countryStats[0].count) * 80)}px`
                            }} />
                            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {deviceStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Devices
                    </CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {deviceStats.map(({ device, count }) => (
                        <div key={device} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{device}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-primary rounded-full" style={{
                              width: `${Math.max(8, (count / deviceStats[0].count) * 80)}px`
                            }} />
                            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {browserStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Browsers
                    </CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {browserStats.map(({ browser, count }) => (
                        <div key={browser} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{browser}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-primary rounded-full" style={{
                              width: `${Math.max(8, (count / browserStats[0].count) * 80)}px`
                            }} />
                            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {(!links || links.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No links to analyze yet.</p>
            <Link href="/dashboard/links">
              <Button>Create your first link</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
