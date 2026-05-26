import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DomainsManager } from './domains-manager'
import { Globe, Lock } from 'lucide-react'
import Link from 'next/link'

export default async function DomainsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [subscriptionResult, domainsResult] = await Promise.all([
    supabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
    supabase.from('custom_domains').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const plan = (subscriptionResult.data?.plan || 'free') as keyof typeof PLANS
  const canUseCustomDomain = PLANS[plan].features.customDomain
  const domains = domainsResult.data || []
  const activeDomain = domains.find(d => d.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Domain</h1>
          <p className="text-muted-foreground mt-1">Use your own domain for all your short links.</p>
        </div>
        <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize">
          {PLANS[plan].name} Plan
        </Badge>
      </div>

      {!canUseCustomDomain ? (
        /* Upgrade gate */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Custom Domain is a Business feature</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Upgrade to the Business plan to use your own branded domain for all short links.
              </p>
            </div>
            <Link href="/dashboard/billing">
              <Button>Upgrade to Business</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active domain banner */}
          {activeDomain && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="flex items-center gap-3 py-4">
                <Globe className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-emerald-900">{activeDomain.domain}</p>
                  <p className="text-sm text-emerald-700">Active — your links are being served from this domain.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your Domain</CardTitle>
              <CardDescription>
                {domains.length === 0
                  ? 'Add a custom domain and follow the DNS instructions to activate it.'
                  : 'Manage your custom short link domain.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DomainsManager domains={domains} canAdd={domains.length === 0} />
            </CardContent>
          </Card>

          <Card className="border-muted bg-muted/30">
            <CardContent className="py-4 space-y-2">
              <p className="text-sm font-medium">How it works</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Add your domain (e.g. <code className="text-xs bg-muted rounded px-1">go.yourbrand.com</code>)</li>
                <li>Add the CNAME and TXT records shown at your domain registrar</li>
                <li>Click <strong>Verify Domain</strong> — DNS changes can take up to 24 hours</li>
                <li>All your short links will automatically use the new domain</li>
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
