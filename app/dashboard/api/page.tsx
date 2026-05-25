import { createClient } from '@/lib/supabase/server'
import { ApiKeysManager } from './api-keys-manager'

export default async function ApiKeysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, name, key_preview, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">
          Manage your API keys to access the Stackly REST API programmatically.
        </p>
      </div>
      <ApiKeysManager apiKeys={apiKeys || []} baseUrl={baseUrl} />
    </div>
  )
}
