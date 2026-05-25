import { createClient } from '@/lib/supabase/server'
import { PLANS, PlanType } from './plans'

export async function getUserPlan(userId: string): Promise<PlanType> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .single()
  return (data?.plan as PlanType) || 'free'
}

export async function canCreateLink(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId)
  const limit = PLANS[plan].linkLimit
  if (limit === Infinity) return { allowed: true }

  const supabase = await createClient()
  const { count } = await supabase
    .from('links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  if ((count || 0) >= limit) {
    return { allowed: false, reason: `Free plan limit of ${limit} links reached. Upgrade to Pro for unlimited links.` }
  }
  return { allowed: true }
}

export async function canAccessAdvancedAnalytics(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return PLANS[plan].features.advancedAnalytics
}
