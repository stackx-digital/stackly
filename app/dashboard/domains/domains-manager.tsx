'use client'

import { useState, useTransition } from 'react'
import { addCustomDomain, verifyCustomDomain, deleteCustomDomain } from '@/actions/domains'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, AlertCircle, Trash2, RefreshCw, Copy, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type DomainRecord = {
  id: string
  domain: string
  verification_token: string
  status: string
  verified_at: string | null
  created_at: string
}

interface DomainsManagerProps {
  domains: DomainRecord[]
  canAdd: boolean
}

function DnsRow({ label, type, name, value }: { label: string; type: string; name: string; value: string }) {
  const { toast } = useToast()
  function copy(text: string) {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied!', description: text })
  }
  return (
    <div className="rounded-lg bg-muted/50 border p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <Badge variant="outline" className="text-xs font-mono">{type}</Badge>
      </div>
      <div className="grid grid-cols-[auto_1fr_24px] gap-2 items-center text-sm font-mono">
        <span className="text-muted-foreground shrink-0">Name</span>
        <span className="truncate text-foreground">{name}</span>
        <button onClick={() => copy(name)} className="text-muted-foreground hover:text-foreground">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-[auto_1fr_24px] gap-2 items-center text-sm font-mono">
        <span className="text-muted-foreground shrink-0">Value</span>
        <span className="truncate text-foreground">{value}</span>
        <button onClick={() => copy(value)} className="text-muted-foreground hover:text-foreground">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function DomainCard({ domain, onDelete }: { domain: DomainRecord; onDelete: () => void }) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const apex = domain.domain.split('.').length === 2
  const txtName = `_stackly-verify.${domain.domain}`
  const txtValue = `stackly-${domain.verification_token}`
  const cnameValue = 'cname.vercel-dns.com'
  const aValue = '76.76.21.21'

  function handleVerify() {
    startTransition(async () => {
      const result = await verifyCustomDomain(domain.id)
      if (result.error) {
        toast({ title: 'Verification failed', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Domain verified!', description: `${domain.domain} is now active.` })
      }
    })
  }

  const statusIcon = {
    active: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    pending: <Clock className="h-4 w-4 text-amber-500" />,
    failed: <AlertCircle className="h-4 w-4 text-destructive" />,
  }[domain.status] ?? <Clock className="h-4 w-4 text-muted-foreground" />

  const statusLabel = {
    active: 'Active',
    pending: 'Pending verification',
    failed: 'Verification failed',
  }[domain.status] ?? domain.status

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        {/* Domain header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{domain.domain}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs">
              {statusIcon}
              <span className="text-muted-foreground">{statusLabel}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {domain.status !== 'active' && (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Step 1 — Point your domain to Stackly</p>
              <p className="text-xs text-muted-foreground">Add this DNS record at your domain registrar:</p>
              {apex ? (
                <DnsRow label="A Record" type="A" name={domain.domain} value={aValue} />
              ) : (
                <DnsRow label="CNAME Record" type="CNAME" name={domain.domain} value={cnameValue} />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Step 2 — Verify domain ownership</p>
              <p className="text-xs text-muted-foreground">Add this TXT record to prove you own the domain:</p>
              <DnsRow label="TXT Record" type="TXT" name={txtName} value={txtValue} />
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              DNS changes can take up to 24 hours to propagate. Click Verify after adding the records.
            </div>

            <Button onClick={handleVerify} disabled={isPending} size="sm" className="w-full gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
              {isPending ? 'Checking DNS…' : 'Verify Domain'}
            </Button>
          </>
        )}

        {domain.status === 'active' && domain.verified_at && (
          <p className="text-xs text-muted-foreground">
            Verified on {new Date(domain.verified_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function DomainsManager({ domains, canAdd }: DomainsManagerProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [inputValue, setInputValue] = useState('')
  const [localDomains, setLocalDomains] = useState(domains)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const domain = inputValue.trim()
    if (!domain) return
    startTransition(async () => {
      const result = await addCustomDomain(domain)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        setInputValue('')
        toast({ title: 'Domain added', description: 'Follow the DNS instructions to verify.' })
      }
    })
  }

  function handleDelete(domainId: string) {
    startTransition(async () => {
      const result = await deleteCustomDomain(domainId)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        setLocalDomains(prev => prev.filter(d => d.id !== domainId))
        toast({ title: 'Domain removed' })
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Add domain form */}
      {canAdd && localDomains.length === 0 && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="go.yourbrand.com"
            className="flex-1"
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !inputValue.trim()}>
            {isPending ? 'Adding…' : 'Add Domain'}
          </Button>
        </form>
      )}

      {/* Domain cards */}
      {localDomains.map((d) => (
        <DomainCard
          key={d.id}
          domain={d}
          onDelete={() => handleDelete(d.id)}
        />
      ))}

      {localDomains.length === 0 && !canAdd && null}
    </div>
  )
}
