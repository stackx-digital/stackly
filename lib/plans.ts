export type PlanType = 'free' | 'pro' | 'business'

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'MYR',
    linkLimit: 20,
    features: {
      customSlug: true,
      qrCode: false,
      advancedAnalytics: false,
      customDomain: false,
      teamAccess: false,
      apiAccess: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 29,
    currency: 'MYR',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    linkLimit: Infinity,
    features: {
      customSlug: true,
      qrCode: true,
      advancedAnalytics: true,
      customDomain: false,
      teamAccess: false,
      apiAccess: false,
    },
  },
  business: {
    name: 'Business',
    price: 79,
    currency: 'MYR',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    linkLimit: Infinity,
    features: {
      customSlug: true,
      qrCode: true,
      advancedAnalytics: true,
      customDomain: true,
      teamAccess: true,
      apiAccess: true,
    },
  },
} as const
