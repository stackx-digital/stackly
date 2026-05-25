'use client'

import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, CreditCard, LogOut, Link2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  user: { email: string; full_name: string; avatar_url: string }
  plan: string
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/links': 'My Links',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/billing': 'Billing',
  '/dashboard/settings': 'Settings',
}

export function DashboardHeader({ user, plan }: HeaderProps) {
  const pathname = usePathname()
  const title =
    Object.entries(PAGE_TITLES).find(([path]) =>
      path === '/dashboard' ? pathname === path : pathname.startsWith(path)
    )?.[1] || 'Dashboard'

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-6 md:px-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <Link2 className="h-5 w-5 text-primary" />
          <span className="font-bold">Stackly</span>
        </Link>
        <h1 className="hidden md:block text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize hidden sm:flex">
          {plan}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" /> Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button type="submit" className="flex w-full items-center text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
