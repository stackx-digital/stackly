import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { SendTestEmailButton } from '@/components/dashboard/send-test-email-button'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initialData={{
              full_name: profile?.full_name || '',
              email: profile?.email || user.email || '',
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Reports</CardTitle>
          <CardDescription>
            Weekly performance summaries are sent every Monday at 9:00 AM MYT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Weekly report</p>
              <p className="text-xs text-muted-foreground mt-1">
                Top links, total clicks, and week-over-week comparison sent to your email every Monday.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Preview what the report looks like</p>
            <SendTestEmailButton />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/auth/update-password" method="POST" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="new_password">New Password</label>
              <input
                type="password"
                id="new_password"
                name="password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Update Password
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
