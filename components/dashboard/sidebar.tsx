'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Link2, LayoutDashboard, BarChart3, CreditCard, Settings, Layers, Key, Zap } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/links', label: 'My Links', icon: Link2, exact: false },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, exact: false },
  { href: '/dashboard/bio', label: 'Link-in-Bio', icon: Layers, exact: false },
  { href: '/dashboard/api', label: 'API Keys', icon: Key, exact: false },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Zap, exact: false },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
]

export function DashboardSidebar({ plan }: { plan: string }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col border-r bg-white z-30">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link2 className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg">Stackly</span>
      </div>
      <nav className="flex-1 space-y-1 p-3 pt-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Current plan</span>
          <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize text-xs">
            {plan}
          </Badge>
        </div>
        {plan === 'free' && (
          <Link
            href="/dashboard/billing"
            className="mt-2 block w-full rounded-md bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            Upgrade to Pro →
          </Link>
        )}
      </div>
    </aside>
  )
}
