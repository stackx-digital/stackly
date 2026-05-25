import { createClient } from '@/lib/supabase/server'
import { CreateLinkDialog } from '@/components/dashboard/create-link-dialog'
import { LinksTable } from '@/components/dashboard/links-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/lib/plans'

export default async function LinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [linksResult, subscriptionResult] = await Promise.all([
    supabase
      .from('links')
      .select(`
        id, slug, destination_url, title, is_active, created_at, expires_at,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single(),
  ])

  const links = linksResult.data || []
  const plan = (subscriptionResult.data?.plan || 'free') as keyof typeof PLANS
  const planConfig = PLANS[plan]
  const linkLimit = planConfig.linkLimit
  const canCreate = linkLimit === Infinity || links.length < (linkLimit as number)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Links</h1>
          <p className="text-muted-foreground">
            {links.length} {linkLimit !== Infinity ? `of ${linkLimit}` : ''} links
          </p>
        </div>
        <CreateLinkDialog canCreate={canCreate} plan={plan} />
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
          <LinksTable links={links} baseUrl={process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'} />
        </CardContent>
      </Card>
    </div>
  )
}
