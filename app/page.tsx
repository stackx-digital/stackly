import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Link2, Shield, Zap, Globe, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Stackly</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50">
        <div className="container text-center">
          <Badge className="mb-4" variant="secondary">Built for Malaysian Marketers</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Track Every Click,<br />
            <span className="text-primary">Grow Your Business</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Stackly is the link tracking platform designed for Malaysian marketers.
            Shorten URLs, track analytics, and understand your audience — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free — No Credit Card Required
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Demo
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free plan includes 20 links. Upgrade anytime for unlimited links.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Track Links</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powerful features built for marketers who want real insights from their links.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Link2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Link Shortening</CardTitle>
                <CardDescription>
                  Create short, branded links with custom slugs. Perfect for social media, SMS, and email campaigns.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Deep Analytics</CardTitle>
                <CardDescription>
                  Track clicks by country, device, browser, and referrer. Understand exactly where your traffic comes from.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Malaysian Market Focus</CardTitle>
                <CardDescription>
                  Prices in MYR, support for local platforms like Shopee, Lazada, and WhatsApp marketing.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Lightning Fast Redirects</CardTitle>
                <CardDescription>
                  Sub-50ms redirect times ensure your visitors get where they&apos;re going instantly — no lost clicks.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Link Protection</CardTitle>
                <CardDescription>
                  Block suspicious traffic and private IP addresses. Keep your analytics clean and accurate.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Share link management with your team on the Business plan. Perfect for agencies and growing teams.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">All prices in Malaysian Ringgit (MYR)</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <div className="text-3xl font-bold">RM 0<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>Get started with link tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">Up to 20 active links</p>
                <p className="text-sm">Basic analytics</p>
                <p className="text-sm">Custom slugs</p>
                <Link href="/signup" className="block mt-4">
                  <Button className="w-full" variant="outline">Get Started</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="border-primary shadow-lg">
              <CardHeader>
                <Badge className="w-fit mb-2">Most Popular</Badge>
                <CardTitle>Pro</CardTitle>
                <div className="text-3xl font-bold">RM 29<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>For serious marketers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">Unlimited links</p>
                <p className="text-sm">Advanced analytics</p>
                <p className="text-sm">QR code generation</p>
                <p className="text-sm">Custom slugs</p>
                <Link href="/signup" className="block mt-4">
                  <Button className="w-full">Start Pro Trial</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Business</CardTitle>
                <div className="text-3xl font-bold">RM 79<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>For agencies and teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">Everything in Pro</p>
                <p className="text-sm">Team access</p>
                <p className="text-sm">Custom domain</p>
                <p className="text-sm">API access</p>
                <Link href="/signup" className="block mt-4">
                  <Button className="w-full" variant="outline">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-white">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Stackly</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Stackly. Built for Malaysian marketers.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
