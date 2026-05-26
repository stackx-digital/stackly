import { createClient } from '@/lib/supabase/server'
import { CreateLinkDialog } from '@/components/dashboard/create-link-dialog'
import { LinksTable } from '@/components/dashboard/links-table'
import { BulkImportDialog } from '@/components/dashboard/bulk-import-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/lib/plans'
import { getBaseUrl } from '@/lib/base-url'

export default async function LinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [linksResult, subscriptionResult, customDomainResult] = await Promise.all([
    supabase
      .from('links')
      .select(`
        id, slug, destination_url, title, is_active, created_at, expires_at,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        pixel_fb, pixel_ga, pixel_gtm, pixel_gads, pixel_tiktok,
        active_from, redirect_mobile, redirect_tablet, geo_rules, ab_variants,
        link_click_summary ( total_clicks )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('custom_domains')
      .select('domain')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const links = linksResult.data || []
  const plan = (subscriptionResult.data?.plan || 'free') as keyof typeof PLANS
  const planConfig = PLANS[plan]
  const linkLimit = planConfig.linkLimit
  const canCreate = linkLimit === Infinity || links.length < (linkLimit as number)
  const activeDomain = customDomainResult.data?.domain
  const baseUrl = activeDomain ? `https://${activeDomain}` : await getBaseUrl()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Links</h1>
          <p className="text-muted-foreground">
            {links.length} {linkLimit !== Infinity ? `of ${linkLimit}` : ''} links
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkImportDialog canCreate={canCreate} />
          <CreateLinkDialog canCreate={canCreate} plan={plan} />
        </div>
      </div>

      {!canCreate && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              You&apos;ve reached the free plan limit of {linkLimit} links.{' '}
              <a href="/dashboard/billing" className="font-medium underline">
                Upgrade to Pro
              </a>{' '}
              for unlimited links.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Links</CardTitle>
              <CardDescription>Manage and track all your shortened links</CardDescription>
            </div>
            <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize">
              {planConfig.name} Plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <LinksTable links={links} baseUrl={baseUrl} />
        </CardContent>
      </Card>
    </div>
  )
}
