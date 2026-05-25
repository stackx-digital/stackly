'use client'

import { useState } from 'react'
import { bulkCreateLinks } from '@/actions/links'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Upload, CheckCircle2, XCircle } from 'lucide-react'

interface BulkImportDialogProps {
  canCreate: boolean
}

interface ImportResult {
  url: string
  slug?: string
  success: boolean
  error?: string
}

export function BulkImportDialog({ canCreate }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResult[] | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)

  function handleReset() {
    setResults(null)
    setGlobalError(null)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setGlobalError(null)
    setResults(null)

    const result = await bulkCreateLinks(formData)

    if (result.error) {
      setGlobalError(result.error)
    } else {
      setResults(result.results)
    }

    setLoading(false)
  }

  const successCount = results?.filter((r) => r.success).length ?? 0
  const failCount = results?.filter((r) => !r.success).length ?? 0

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) handleReset() }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={!canCreate}>
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Links (CSV)
          </DialogTitle>
          <DialogDescription>
            Bulk-create up to 50 links at once from CSV data.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {successCount} created
              </span>
              {failCount > 0 && (
                <span className="flex items-center gap-1.5 text-red-600 font-medium">
                  <XCircle className="h-4 w-4" />
                  {failCount} failed
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border divide-y text-xs">
              {results.map((r, i) => (
                <div key={i} className={`px-3 py-2 flex items-start gap-2 ${r.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  {r.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-mono truncate text-gray-700">{r.url}</p>
                    {r.success && r.slug && (
                      <p className="text-green-700">/{r.slug}</p>
                    )}
                    {!r.success && r.error && (
                      <p className="text-red-600">{r.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleReset}>
                Import More
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={handleSubmit}>
            <div className="space-y-4 py-4">
              {globalError && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                  {globalError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="csv_data">CSV Data</Label>
                <textarea
                  id="csv_data"
                  name="csv_data"
                  rows={10}
                  required
                  placeholder={`https://example.com/page1\nhttps://example.com/page2,My Campaign\nhttps://example.com/page3,Product Launch,my-slug`}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[180px]"
                />
                <p className="text-xs text-muted-foreground">
                  One URL per line, or CSV: <span className="font-mono">url,title,slug</span> (title and slug are optional). Max 50 rows.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Importing...' : 'Import Links'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
