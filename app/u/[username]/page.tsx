import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const DESIGNS = {
  violet: {
    wrap: 'bg-gradient-to-br from-violet-600 to-purple-700',
    text: 'text-white',
    subtext: 'text-white/80',
    avatar: 'bg-white/20 text-white',
    btn: 'bg-white text-violet-700 hover:bg-violet-50 shadow-sm rounded-xl',
    footer: 'text-white/50 hover:text-white/80',
  },
  ocean: {
    wrap: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    text: 'text-white',
    subtext: 'text-white/80',
    avatar: 'bg-white/20 text-white',
    btn: 'bg-white text-blue-700 hover:bg-blue-50 shadow-sm rounded-xl',
    footer: 'text-white/50 hover:text-white/80',
  },
  forest: {
    wrap: 'bg-gradient-to-br from-emerald-500 to-teal-700',
    text: 'text-white',
    subtext: 'text-white/80',
    avatar: 'bg-white/20 text-white',
    btn: 'bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm rounded-xl',
    footer: 'text-white/50 hover:text-white/80',
  },
  sunset: {
    wrap: 'bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500',
    text: 'text-white',
    subtext: 'text-white/80',
    avatar: 'bg-white/20 text-white',
    btn: 'bg-white text-rose-600 hover:bg-rose-50 shadow-md rounded-full',
    footer: 'text-white/50 hover:text-white/80',
  },
  glass: {
    wrap: 'bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600',
    text: 'text-white',
    subtext: 'text-white/70',
    avatar: 'bg-white/20 backdrop-blur-sm text-white border border-white/30',
    btn: 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 rounded-2xl',
    footer: 'text-white/40 hover:text-white/70',
  },
  neon: {
    wrap: 'bg-gray-950',
    text: 'text-purple-300',
    subtext: 'text-purple-400/70',
    avatar: 'bg-purple-900/50 text-purple-300 border border-purple-500/40',
    btn: 'bg-transparent text-purple-300 border-2 border-purple-500 hover:bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.25)] rounded-lg',
    footer: 'text-purple-900 hover:text-purple-700',
  },
  dark: {
    wrap: 'bg-gradient-to-br from-gray-900 to-slate-800',
    text: 'text-white',
    subtext: 'text-white/70',
    avatar: 'bg-white/10 text-white border border-white/10',
    btn: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 rounded-xl',
    footer: 'text-white/30 hover:text-white/60',
  },
  minimal: {
    wrap: 'bg-gray-50',
    text: 'text-gray-900',
    subtext: 'text-gray-500',
    avatar: 'bg-gray-200 text-gray-700',
    btn: 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm rounded-xl',
    footer: 'text-gray-400 hover:text-gray-600',
  },
} as const

type DesignKey = keyof typeof DESIGNS

export default async function BioPage({ params }: { params: { username: string } }) {
  const { username } = params
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('bio_pages')
    .select('*, bio_links(*)')
    .eq('username', username)
    .eq('is_published', true)
    .single()

  if (!page) notFound()

  // backward-compat: map old theme names to new design keys
  const themeMap: Record<string, DesignKey> = { blue: 'ocean', green: 'forest' }
  const rawTheme = page.theme as string
  const designKey = (themeMap[rawTheme] || rawTheme) as DesignKey
  const d = DESIGNS[designKey] || DESIGNS.violet

  const activeLinks = (page.bio_links || [])
    .filter((l: { is_active: boolean }) => l.is_active)
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
  const initials = (page.title || username).slice(0, 2).toUpperCase()

  return (
    <div className={`min-h-screen ${d.wrap} flex flex-col items-center px-4 py-16`}>
      <div className="w-full max-w-md space-y-6">
        {/* Avatar + info */}
        <div className="text-center space-y-3">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${d.avatar}`}>
            {initials}
          </div>
          {page.title && <h1 className={`text-2xl font-bold ${d.text}`}>{page.title}</h1>}
          {page.description && <p className={`text-sm ${d.subtext}`}>{page.description}</p>}
        </div>

        {/* Links */}
        <div className="space-y-3">
          {activeLinks.map((link: { id: string, url: string, title: string }) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full text-center py-3.5 px-6 font-medium transition-all ${d.btn}`}
            >
              {link.title}
            </a>
          ))}
          {activeLinks.length === 0 && (
            <p className={`text-center text-sm ${d.subtext}`}>No links added yet.</p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <Link href="/" className={`text-xs transition-colors ${d.footer}`}>
            Powered by Stackly
          </Link>
        </div>
      </div>
    </div>
  )
}
