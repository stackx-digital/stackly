import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from('users').select('full_name, email, avatar_url').eq('id', user.id).single(),
    supabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
  ])

  const userData = {
    email: user.email || '',
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
  }
  const plan = subscription?.plan || 'free'

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar plan={plan} />
      <div className="md:pl-60">
        <DashboardHeader user={userData} plan={plan} />
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
