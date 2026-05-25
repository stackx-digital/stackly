import { createClient } from '@/lib/supabase/server'
import { WebhooksManager } from './webhooks-manager'

export default async function WebhooksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('id, name, url, secret, events, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <p className="text-muted-foreground">
          Receive real-time HTTP notifications when clicks and other events occur on your links.
        </p>
      </div>
      <WebhooksManager webhooks={webhooks || []} />
    </div>
  )
}
