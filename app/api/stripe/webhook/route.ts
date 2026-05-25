import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role for webhook (bypasses RLS)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  current_period_start: string | null
  current_period_end: string | null
} {
  // In newer Stripe API versions, period info is on subscription items
  const item = subscription.items.data[0]
  if (item && 'current_period_start' in item && 'current_period_end' in item) {
    const itemWithPeriod = item as typeof item & {
      current_period_start: number
      current_period_end: number
    }
    return {
      current_period_start: new Date(itemWithPeriod.current_period_start * 1000).toISOString(),
      current_period_end: new Date(itemWithPeriod.current_period_end * 1000).toISOString(),
    }
  }
  // Fallback: use start_date
  return {
    current_period_start: subscription.start_date
      ? new Date(subscription.start_date * 1000).toISOString()
      : null,
    current_period_end: null,
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan

      if (userId && plan && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const period = getSubscriptionPeriod(subscription)

        await supabase
          .from('subscriptions')
          .update({
            plan,
            status: 'active',
            stripe_subscription_id: subscription.id,
            current_period_start: period.current_period_start,
            current_period_end: period.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (sub) {
        const priceId = subscription.items.data[0]?.price.id
        let plan = 'free'

        if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = 'pro'
        else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) plan = 'business'

        const period = getSubscriptionPeriod(subscription)

        await supabase
          .from('subscriptions')
          .update({
            plan,
            status: subscription.status === 'active' ? 'active' : subscription.status,
            current_period_start: period.current_period_start,
            current_period_end: period.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', sub.user_id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (sub) {
        await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'inactive',
            stripe_subscription_id: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', sub.user_id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (sub) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', sub.user_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
