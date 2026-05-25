import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Link2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
      <Link2 className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-4xl font-bold mb-2">Link Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        This link doesn&apos;t exist or may have been removed. Check the URL and try again.
      </p>
      <Link href="/">
        <Button>Go to Stackly</Button>
      </Link>
    </div>
  )
}
