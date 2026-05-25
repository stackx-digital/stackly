'use client'

import { useRef, useState, useTransition } from 'react'
import { addBioLink, deleteBioLink, toggleBioLink } from '@/actions/bio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus } from 'lucide-react'

type BioLink = {
  id: string
  bio_page_id: string
  title: string
  url: string
  position: number
  is_active: boolean
  created_at: string
}

type BioPageData = {
  id: string
  user_id: string
  username: string
  title: string | null
  description: string | null
  theme: string
  avatar_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  bio_links: BioLink[] | null
} | null

interface BioLinksManagerProps {
  bioPage: BioPageData
}

export function BioLinksManager({ bioPage }: BioLinksManagerProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [addError, setAddError] = useState<string | null>(null)

  const links = (bioPage?.bio_links || []).sort((a, b) => a.position - b.position)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!bioPage?.id) {
      setAddError('Save your bio page settings first before adding links.')
      return
    }
    const formData = new FormData(e.currentTarget)
    setAddError(null)
    startTransition(async () => {
      const result = await addBioLink(bioPage.id, formData)
      if (result.error) {
        setAddError(result.error)
      } else {
        formRef.current?.reset()
      }
    })
  }

  function handleDelete(linkId: string) {
    startTransition(async () => {
      await deleteBioLink(linkId)
    })
  }

  function handleToggle(linkId: string, checked: boolean) {
    startTransition(async () => {
      await toggleBioLink(linkId, checked)
    })
  }

  return (
    <div className="space-y-4">
      {/* Existing links */}
      {links.length > 0 ? (
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.id} className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{link.title}</p>
                <p className="text-xs text-muted-foreground truncate">{link.url}</p>
              </div>
              <Switch
                checked={link.is_active}
                onCheckedChange={(checked) => handleToggle(link.id, checked)}
                aria-label={`Toggle ${link.title}`}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                onClick={() => handleDelete(link.id)}
                aria-label={`Delete ${link.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No links yet. Add one below.</p>
      )}

      {/* Add link form */}
      <form ref={formRef} onSubmit={handleAdd} className="space-y-2 border-t pt-4">
        <p className="text-sm font-medium">Add a Link</p>
        <Input name="title" placeholder="Link title (e.g. My Website)" required />
        <Input name="url" placeholder="https://example.com" type="url" required />
        {addError && <p className="text-xs text-destructive">{addError}</p>}
        <Button type="submit" disabled={isPending} size="sm" className="w-full gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {isPending ? 'Adding...' : 'Add Link'}
        </Button>
      </form>
    </div>
  )
}
