'use client'

import { useRef, useState, useTransition } from 'react'
import { upsertBioPage } from '@/actions/bio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DESIGNS = [
  {
    value: 'violet',
    label: 'Violet',
    preview: { wrap: 'bg-gradient-to-br from-violet-600 to-purple-700', btn: 'bg-white text-violet-700 rounded-lg' },
  },
  {
    value: 'ocean',
    label: 'Ocean',
    preview: { wrap: 'bg-gradient-to-br from-blue-500 to-cyan-600', btn: 'bg-white text-blue-700 rounded-lg' },
  },
  {
    value: 'forest',
    label: 'Forest',
    preview: { wrap: 'bg-gradient-to-br from-emerald-500 to-teal-700', btn: 'bg-white text-emerald-700 rounded-lg' },
  },
  {
    value: 'sunset',
    label: 'Sunset',
    preview: { wrap: 'bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500', btn: 'bg-white text-rose-600 rounded-full' },
  },
  {
    value: 'glass',
    label: 'Glass',
    preview: { wrap: 'bg-gradient-to-br from-violet-500 to-indigo-600', btn: 'bg-white/30 text-white border border-white/40 rounded-2xl' },
  },
  {
    value: 'neon',
    label: 'Neon',
    preview: { wrap: 'bg-gray-950', btn: 'border-2 border-purple-500 text-purple-300 rounded-lg' },
  },
  {
    value: 'dark',
    label: 'Dark',
    preview: { wrap: 'bg-gradient-to-br from-gray-900 to-slate-800', btn: 'bg-white/15 text-white border border-white/20 rounded-lg' },
  },
  {
    value: 'minimal',
    label: 'Minimal',
    preview: { wrap: 'bg-gray-100', btn: 'bg-white border border-gray-200 text-gray-900 rounded-lg' },
  },
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

  // map old theme names to new design keys
  const themeMap: Record<string, string> = { blue: 'ocean', green: 'forest' }
  const rawTheme = bioPage?.theme || 'violet'
  const initialDesign = themeMap[rawTheme] || rawTheme

  const [selectedDesign, setSelectedDesign] = useState(initialDesign)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('theme', selectedDesign)

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
          <span className="text-sm text-muted-foreground">
            {(process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://stackly-wheat.vercel.app')).replace(/https?:\/\//, '')}/u/
          </span>
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

      <div className="space-y-2">
        <Label>Design</Label>
        <div className="grid grid-cols-4 gap-2">
          {DESIGNS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setSelectedDesign(d.value)}
              className={`relative flex flex-col overflow-hidden rounded-lg border-2 transition-all focus:outline-none ${
                selectedDesign === d.value
                  ? 'border-primary shadow-md scale-[1.03]'
                  : 'border-transparent hover:border-muted-foreground/30'
              }`}
              aria-label={d.label}
            >
              {/* Mini preview */}
              <div className={`h-14 w-full flex flex-col items-center justify-center gap-1 p-1.5 ${d.preview.wrap}`}>
                <div className={`w-5 h-5 rounded-full bg-white/20`} />
                <div className={`w-full h-3 text-[6px] flex items-center justify-center ${d.preview.btn}`}>
                  Link
                </div>
              </div>
              {/* Label */}
              <div className="bg-background px-1 py-0.5 text-center">
                <span className="text-[10px] font-medium text-muted-foreground">{d.label}</span>
              </div>
              {/* Selected checkmark */}
              {selectedDesign === d.value && (
                <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
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
