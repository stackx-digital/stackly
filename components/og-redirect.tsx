'use client'

import { useEffect } from 'react'

export function OgRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url)
  }, [url])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
        <p className="text-xs text-muted-foreground">
          <a href={url} className="underline">Click here</a> if not redirected automatically.
        </p>
      </div>
    </div>
  )
}
