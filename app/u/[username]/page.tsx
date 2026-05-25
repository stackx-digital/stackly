import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const THEMES = {
  violet: { bg: 'from-violet-600 to-purple-700', btn: 'bg-white text-violet-700 hover:bg-violet-50 shadow-sm', text: 'text-white' },
  blue: { bg: 'from-blue-600 to-indigo-700', btn: 'bg-white text-blue-700 hover:bg-blue-50 shadow-sm', text: 'text-white' },
  green: { bg: 'from-emerald-500 to-teal-600', btn: 'bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm', text: 'text-white' },
  dark: { bg: 'from-gray-900 to-slate-800', btn: 'bg-white/10 text-white border border-white/20 hover:bg-white/20', text: 'text-white' },
  minimal: { bg: 'bg-gray-50', btn: 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm', text: 'text-gray-900' },
} as const

type Theme = keyof typeof THEMES

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

  const theme = THEMES[(page.theme as Theme) || 'violet'] || THEMES.violet
  const activeLinks = (page.bio_links || [])
    .filter((l: { is_active: boolean }) => l.is_active)
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
  const initials = (page.title || username).slice(0, 2).toUpperCase()

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} flex flex-col items-center px-4 py-16`}>
      <div className="w-full max-w-md space-y-6">
        {/* Avatar + info */}
        <div className="text-center space-y-3">
          <div className={`mx-auto w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold ${theme.text}`}>
            {initials}
          </div>
          {page.title && <h1 className={`text-2xl font-bold ${theme.text}`}>{page.title}</h1>}
          {page.description && <p className={`text-sm ${theme.text} opacity-80`}>{page.description}</p>}
        </div>

        {/* Links */}
        <div className="space-y-3">
          {activeLinks.map((link: { id: string, url: string, title: string }) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full text-center py-3.5 px-6 rounded-xl font-medium transition-all ${theme.btn}`}
            >
              {link.title}
            </a>
          ))}
          {activeLinks.length === 0 && (
            <p className={`text-center text-sm ${theme.text} opacity-60`}>No links added yet.</p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <Link href="/" className={`text-xs ${theme.text} opacity-50 hover:opacity-80`}>
            Powered by Stackly
          </Link>
        </div>
      </div>
    </div>
  )
}
