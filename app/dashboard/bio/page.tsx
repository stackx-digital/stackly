import { createClient } from '@/lib/supabase/server'
import { BioSettingsForm } from './bio-settings-form'
import { BioLinksManager } from './bio-links-manager'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

export default async function BioDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bioPage } = await supabase
    .from('bio_pages')
    .select('*, bio_links(*)')
    .eq('user_id', user.id)
    .order('position', { referencedTable: 'bio_links', ascending: true })
    .single()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stackly.my'
  const bioUrl = bioPage ? `${baseUrl}/u/${bioPage.username}` : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Link-in-Bio</h1>
        <p className="text-muted-foreground mt-1">Create a public page to share all your links in one place.</p>
      </div>

      {bioUrl && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4 gap-4">
            <span className="text-sm font-medium truncate">{bioUrl}</span>
            <div className="flex gap-2 shrink-0">
              <a href={bioUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Page Settings</CardTitle>
            <CardDescription>Configure your bio page appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <BioSettingsForm bioPage={bioPage ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
            <CardDescription>Manage your bio page links</CardDescription>
          </CardHeader>
          <CardContent>
            <BioLinksManager bioPage={bioPage ?? null} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
