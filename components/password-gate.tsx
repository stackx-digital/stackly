'use client'

import { useState, useTransition } from 'react'
import { verifyLinkPassword } from '@/actions/links'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

interface PasswordGateProps {
  linkId: string
  slug: string
}

export function PasswordGate({ linkId, slug }: PasswordGateProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await verifyLinkPassword(linkId, formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 p-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-lg border border-violet-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stackly</h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            This link is password protected
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="link_id" value={linkId} />
          <input type="hidden" name="slug" value={slug} />

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password to continue"
              required
              autoFocus
              className="border-violet-200 focus-visible:ring-violet-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isPending ? 'Verifying...' : 'Unlock'}
          </Button>
        </form>
      </div>
    </div>
  )
}
