'use client'

import { useState } from 'react'
import { createLink } from '@/actions/links'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Link2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface CreateLinkDialogProps {
  canCreate: boolean
  plan?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CreateLinkDialog({ canCreate, plan: _plan }: CreateLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await createLink(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    toast({
      title: 'Link created!',
      description: `Your short link is ready to share.`,
    })
    setOpen(false)
    setLoading(false)
  }

  if (!canCreate) {
    return (
      <Link href="/dashboard/billing">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Upgrade to Create More
        </Button>
      </Link>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Create New Link
          </DialogTitle>
          <DialogDescription>
            Shorten a URL and start tracking clicks instantly.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="destination_url">Destination URL *</Label>
              <Input
                id="destination_url"
                name="destination_url"
                type="url"
                placeholder="https://example.com/your-long-url"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Shopee Campaign - August 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Custom Slug (optional)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">stackly.my/</span>
                <Input
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder="my-link"
                  pattern="[a-zA-Z0-9_-]+"
                  title="Only letters, numbers, hyphens, and underscores"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for a random slug. Only letters, numbers, - and _ allowed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
