'use client'

import { useRef, useState, useTransition } from 'react'
import { upsertBioPage } from '@/actions/bio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const THEMES = [
  { value: 'violet', label: 'Violet', color: 'bg-violet-500' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-emerald-500' },
  { value: 'dark', label: 'Dark', color: 'bg-gray-800' },
  { value: 'minimal', label: 'Minimal', color: 'bg-gray-200' },
]

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

interface BioSettingsFormProps {
  bioPage: BioPageData
}

export function BioSettingsForm({ bioPage }: BioSettingsFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedTheme, setSelectedTheme] = useState(bioPage?.theme || 'violet')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('theme', selectedTheme)

    startTransition(async () => {
      const result = await upsertBioPage(formData)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Bio page saved!' })
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{(process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://stackly-wheat.vercel.app')).replace(/https?:\/\//, '')}/u/</span>
          <Input
            id="username"
            name="username"
            defaultValue={bioPage?.username || ''}
            placeholder="yourname"
            className="flex-1"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">3-30 characters: letters, numbers, _ or -</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Display Name</Label>
        <Input
          id="title"
          name="title"
          defaultValue={bioPage?.title || ''}
          placeholder="Your Name or Brand"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Bio</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={bioPage?.description || ''}
          placeholder="A short bio or description..."
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Theme</Label>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSelectedTheme(t.value)}
              title={t.label}
              className={`w-8 h-8 rounded-full ${t.color} transition-all focus:outline-none ${
                selectedTheme === t.value
                  ? 'ring-2 ring-offset-2 ring-primary scale-110'
                  : 'opacity-70 hover:opacity-100'
              }`}
              aria-label={t.label}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground capitalize">Selected: {selectedTheme}</p>
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-destructive' : 'text-emerald-600'}`}>
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  )
}
