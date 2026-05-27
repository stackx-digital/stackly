'use client'

import { useState } from 'react'
import { deleteLink } from '@/actions/links'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Copy, ExternalLink, MoreHorizontal, Trash2, BarChart2, QrCode, Pencil, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, truncate } from '@/lib/utils'
import Link from 'next/link'
import { QRDialog } from '@/components/dashboard/qr-dialog'
import { EditLinkDialog } from '@/components/dashboard/edit-link-dialog'

interface LinkRow {
  id: string
  slug: string
  destination_url: string
  title: string | null
  is_active: boolean
  created_at: string
  expires_at: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  pixel_fb: string | null
  pixel_ga: string | null
  pixel_gtm: string | null
  pixel_gads: string | null
  pixel_tiktok: string | null
  active_from: string | null
  redirect_mobile: string | null
  redirect_tablet: string | null
  geo_rules: unknown
  ab_variants: unknown
  og_title?: string | null
  og_description?: string | null
  og_image_url?: string | null
  health_status?: string | null
  health_http_status?: number | null
  last_health_check_at?: string | null
  link_click_summary: { total_clicks: number; unique_clicks?: number } | { total_clicks: number; unique_clicks?: number }[] | null
}

interface LinksTableProps {
  links: LinkRow[]
  baseUrl: string
}

export function LinksTable({ links, baseUrl }: LinksTableProps) {
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [qrSlug, setQrSlug] = useState<string | null>(null)
  const [editingLink, setEditingLink] = useState<LinkRow | null>(null)
  const [search, setSearch] = useState('')

  const shortUrl = (slug: string) => `${baseUrl}/${slug}`

  function HealthDot({ status, httpStatus, checkedAt }: { status?: string | null; httpStatus?: number | null; checkedAt?: string | null }) {
    if (!status || status === 'unknown') {
      return <span title="Not yet checked" className="inline-block w-2 h-2 rounded-full bg-gray-300 shrink-0" />
    }
    if (status === 'down') {
      const label = httpStatus ? `Down (HTTP ${httpStatus})` : 'Unreachable'
      return <span title={label} className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
    }
    if (status === 'redirected') {
      return <span title={`Redirecting (${httpStatus ?? '3xx'})`} className="inline-block w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
    }
    const when = checkedAt ? new Date(checkedAt).toLocaleString('en-MY') : ''
    return <span title={`Healthy${when ? ` · checked ${when}` : ''}`} className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />
  }

  async function handleCopy(slug: string) {
    await navigator.clipboard.writeText(shortUrl(slug))
    toast({ title: 'Copied!', description: 'Link copied to clipboard.' })
  }

  async function handleDelete(linkId: string) {
    setDeletingId(linkId)
    const result = await deleteLink(linkId)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Link deleted', description: 'Your link has been removed.' })
    }
    setDeletingId(null)
  }

  const filtered = links.filter(l =>
    !search ||
    l.slug.includes(search.toLowerCase()) ||
    (l.title?.toLowerCase().includes(search.toLowerCase())) ||
    l.destination_url.toLowerCase().includes(search.toLowerCase())
  )

  const activeQrLink = links.find(l => l.slug === qrSlug)

  if (links.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No links yet. Create your first link!</p>
      </div>
    )
  }

  return (
    <>
    {editingLink && (
      <EditLinkDialog
        link={editingLink}
        open={!!editingLink}
        onOpenChange={(open) => { if (!open) setEditingLink(null) }}
      />
    )}
    {activeQrLink && (
      <QRDialog
        url={shortUrl(activeQrLink.slug)}
        slug={activeQrLink.slug}
        open={!!qrSlug}
        onOpenChange={(open) => { if (!open) setQrSlug(null) }}
      />
    )}
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search links..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
    {filtered.length === 0 && search ? (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No links match your search.</p>
      </div>
    ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Link</TableHead>
          <TableHead className="hidden md:table-cell">Destination</TableHead>
          <TableHead className="hidden sm:table-cell">Clicks</TableHead>
          <TableHead className="hidden sm:table-cell">Created</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((link) => {
          const clicks = Array.isArray(link.link_click_summary)
            ? link.link_click_summary[0]?.total_clicks
            : (link.link_click_summary as { total_clicks?: number } | null)?.total_clicks
          return (
          <TableRow key={link.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <HealthDot status={link.health_status} httpStatus={link.health_http_status} checkedAt={link.last_health_check_at} />
                  <span className="font-medium text-sm text-primary">
                    {baseUrl.replace('https://', '').replace('http://', '')}/{link.slug}
                  </span>
                  {link.title && (
                    <Badge variant="secondary" className="text-xs hidden sm:flex">
                      {truncate(link.title, 20)}
                    </Badge>
                  )}
                  {link.health_status === 'down' && (
                    <Badge variant="destructive" className="text-xs gap-1 hidden sm:flex">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Down
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground md:hidden">
                  {truncate(link.destination_url, 40)}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="text-sm text-muted-foreground">
                {truncate(link.destination_url, 50)}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
              {clicks ?? '—'}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
              {formatDate(link.created_at)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingLink(link)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopy(link.slug)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={shortUrl(link.slug)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open link
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/analytics?link=${link.id}`}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      View analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQrSlug(link.slug)}>
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(link.id)}
                    disabled={deletingId === link.id}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deletingId === link.id ? 'Deleting...' : 'Delete link'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
          )
        })}
      </TableBody>
    </Table>
    )}
    </>
  )
}
