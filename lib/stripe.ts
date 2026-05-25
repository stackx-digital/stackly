import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return _stripe
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
