import { headers } from 'next/headers'

export async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  // Detect from the actual incoming request so any domain works automatically
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || 'https'
  return `${proto}://${host}`
}
