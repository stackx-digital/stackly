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
import { Copy, ExternalLink, MoreHorizontal, Trash2, BarChart2, QrCode } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, truncate } from '@/lib/utils'
import Link from 'next/link'
import { QRDialog } from '@/components/dashboard/qr-dialog'

interface LinkRow {
  id: string
  slug: string
  destination_url: string
  title: string | null
  is_active: boolean
  created_at: string
  expires_at: string | null
}

interface LinksTableProps {
  links: LinkRow[]
  baseUrl: string
}

export function LinksTable({ links, baseUrl }: LinksTableProps) {
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [qrSlug, setQrSlug] = useState<string | null>(null)

  const shortUrl = (slug: string) => `${baseUrl}/${slug}`

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
    {activeQrLink && (
      <QRDialog
        url={shortUrl(activeQrLink.slug)}
        slug={activeQrLink.slug}
        open={!!qrSlug}
        onOpenChange={(open) => { if (!open) setQrSlug(null) }}
      />
    )}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Link</TableHead>
          <TableHead className="hidden md:table-cell">Destination</TableHead>
          <TableHead className="hidden sm:table-cell">Created</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {links.map((link) => (
          <TableRow key={link.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-primary">
                    {baseUrl.replace('https://', '').replace('http://', '')}/{link.slug}
                  </span>
                  {link.title && (
                    <Badge variant="secondary" className="text-xs hidden sm:flex">
                      {truncate(link.title, 20)}
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
        ))}
      </TableBody>
    </Table>
    </>
  )
}
