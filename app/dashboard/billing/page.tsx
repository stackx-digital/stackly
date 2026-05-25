import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/plans'
import { CheckCircle2, CreditCard } from 'lucide-react'
import { BillingActions } from '@/components/dashboard/billing-actions'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const plan = (subscription?.plan || 'free') as keyof typeof PLANS
  const planConfig = PLANS[plan]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold capitalize">{planConfig.name} Plan</p>
              <p className="text-muted-foreground">
                {plan === 'free' ? 'Free forever' : `RM ${planConfig.price}/month`}
              </p>
            </div>
            <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize">
              {subscription?.status || 'active'}
            </Badge>
          </div>
          {subscription?.current_period_end && (
            <p className="text-sm text-muted-foreground">
              {subscription.cancel_at_period_end
                ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString('en-MY')}`
                : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString('en-MY')}`}
            </p>
          )}
          {plan !== 'free' && (
            <BillingActions
              subscriptionId={subscription?.stripe_subscription_id}
              cancelAtPeriodEnd={subscription?.cancel_at_period_end}
            />
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([planKey, config]) => {
            const isCurrentPlan = plan === planKey
            const features = Object.entries(config.features)

            return (
              <Card key={planKey} className={isCurrentPlan ? 'border-primary shadow-md' : ''}>
                <CardHeader>
                  {isCurrentPlan && <Badge className="w-fit mb-1">Current Plan</Badge>}
                  <CardTitle className="capitalize">{config.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    {config.price === 0 ? 'Free' : `RM ${config.price}`}
                    {config.price > 0 && <span className="text-base font-normal text-muted-foreground">/mo</span>}
                  </div>
                  <CardDescription>
                    {config.linkLimit === Infinity ? 'Unlimited links' : `Up to ${config.linkLimit} links`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {features.map(([feature, enabled]) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2
                          className={`h-4 w-4 flex-shrink-0 ${enabled ? 'text-primary' : 'text-muted-foreground/30'}`}
                        />
                        <span className={enabled ? '' : 'text-muted-foreground line-through'}>
                          {feature.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {!isCurrentPlan && planKey !== 'free' && (
                    <form action={`/api/stripe/checkout?plan=${planKey}`} method="POST" className="mt-4">
                      <Button type="submit" className="w-full">
                        {plan === 'free' ? `Upgrade to ${config.name}` : `Switch to ${config.name}`}
                      </Button>
                    </form>
                  )}
                  {!isCurrentPlan && planKey === 'free' && plan !== 'free' && (
                    <Button variant="outline" className="w-full" disabled>
                      Downgrade (cancel subscription)
                    </Button>
                  )}
                  {isCurrentPlan && (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
