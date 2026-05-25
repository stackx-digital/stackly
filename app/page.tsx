import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Check,
  X,
  Link2,
  BarChart3,
  Globe,
  Zap,
  Shield,
  Users,
  MousePointerClick,
  ArrowRight,
  RefreshCw,
  QrCode,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">

      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-6 w-6 text-violet-600" />
            <span className="font-bold text-xl tracking-tight">Stackly</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 py-24 md:py-36">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <Badge className="mb-6 bg-violet-100 text-violet-700 border-violet-200 px-4 py-1.5 text-sm font-medium">
            🇲🇾 Built for Malaysian Marketers
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Track Every Click.
            </span>
            <br />
            <span className="text-slate-900">Win Every Campaign.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Shorten your links. See exactly who clicked, from where, using what device — in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white text-base px-8 py-6 rounded-xl shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all">
                Start Free — No Credit Card Needed
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-6 rounded-xl border-slate-300 hover:bg-slate-50">
                View Demo
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium">
            <span>🇲🇾</span>
            <span>Trusted by <strong className="text-slate-700">500+ marketers</strong> in Malaysia</span>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            You&apos;re sharing links blind.
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            You boost TikTok, blast WhatsApp groups, run Facebook Ads.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12 text-left">
            {[
              "Don't know if anyone clicked",
              "Don't know which platform worked",
              "Don't know mobile vs desktop",
              "Spending money with zero data",
            ].map((pain) => (
              <div key={pain} className="flex items-start gap-3 bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <span className="text-xl mt-0.5 flex-shrink-0">❌</span>
                <span className="text-slate-200 text-sm md:text-base">{pain}</span>
              </div>
            ))}
          </div>
          <div className="inline-block bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl px-10 py-6">
            <p className="text-white text-2xl md:text-3xl font-bold tracking-tight">That ends today.</p>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Everything you need to <br className="hidden md:block" />track smarter
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Powerful link analytics built specifically for how Malaysian marketers work.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-slate-200 hover:border-violet-300 hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-4 group-hover:bg-violet-600 transition-colors">
                  <Link2 className="h-6 w-6 text-violet-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-lg">Smart Short Links</CardTitle>
                <CardDescription className="text-slate-500 text-sm leading-relaxed">
                  Create custom slugs that mean something. Edit the destination URL anytime — your short link stays the same.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200 hover:border-violet-300 hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                  <BarChart3 className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-lg">Real-Time Analytics</CardTitle>
                <CardDescription className="text-slate-500 text-sm leading-relaxed">
                  Total clicks, unique visitors, and a live timeline — updated the instant someone clicks your link.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200 hover:border-violet-300 hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <Globe className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-lg">Know Your Audience</CardTitle>
                <CardDescription className="text-slate-500 text-sm leading-relaxed">
                  Country, device, browser, and referrer data. Know exactly who clicked and where they came from.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200 hover:border-violet-300 hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors">
                  <RefreshCw className="h-6 w-6 text-amber-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-lg">Control Your Links</CardTitle>
                <CardDescription className="text-slate-500 text-sm leading-relaxed">
                  Change the destination URL, pause a link, or delete it entirely. Full control, anytime.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200 hover:border-violet-300 hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-4 group-hover:bg-rose-600 transition-colors">
                  <Zap className="h-6 w-6 text-rose-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-lg">Chrome Extension</CardTitle>
                <CardDescription className="text-slate-500 text-sm leading-relaxed">
                  Shorten any page with one click right from your browser toolbar. No copying and pasting URLs.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200 hover:border-violet-300 hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center mb-4 group-hover:bg-cyan-600 transition-colors">
                  <QrCode className="h-6 w-6 text-cyan-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-lg">QR Code Generator</CardTitle>
                <CardDescription className="text-slate-500 text-sm leading-relaxed">
                  Every link gets a QR code automatically. Perfect for flyers, packaging, and offline marketing.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Who It&apos;s For</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Real marketers. Real results.</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Stackly works across every marketing channel Malaysians actually use.
            </p>
          </div>
          <div className="space-y-16">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                  <Users className="h-4 w-4" />
                  Affiliate Marketers
                </div>
                <h3 className="text-2xl font-bold mb-3">Know which offers are actually converting</h3>
                <p className="text-slate-600 leading-relaxed">
                  You post affiliate links in Telegram groups, Facebook communities, and TikTok bios. With Stackly, you&apos;ll finally see which channel drives real clicks — and which ones to drop.
                </p>
              </div>
              <Card className="flex-1 border-violet-200 bg-white shadow-sm">
                <CardContent className="pt-6">
                  <blockquote className="text-slate-700 italic leading-relaxed mb-4">
                    &ldquo;I used to guess which Telegram group worked best. Now I know exactly — Group A gets 3x the clicks of Group B. I doubled down and doubled my commissions.&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">AF</div>
                    <div>
                      <p className="font-semibold text-sm">Ahmad Farid</p>
                      <p className="text-slate-500 text-xs">Affiliate Marketer, Kuala Lumpur</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col md:flex-row-reverse items-center gap-10">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                  <BarChart3 className="h-4 w-4" />
                  Facebook &amp; TikTok Advertisers
                </div>
                <h3 className="text-2xl font-bold mb-3">Stop paying for clicks that don&apos;t convert</h3>
                <p className="text-slate-600 leading-relaxed">
                  Run ads across Meta and TikTok with separate tracking links per campaign. See exactly which ad set drives real mobile traffic versus desktop — and optimize your spend accordingly.
                </p>
              </div>
              <Card className="flex-1 border-indigo-200 bg-white shadow-sm">
                <CardContent className="pt-6">
                  <blockquote className="text-slate-700 italic leading-relaxed mb-4">
                    &ldquo;I was burning RM2,000 a month on Facebook Ads with no idea what worked. Stackly showed me 80% of my clicks came from mobile. I resized my creatives and my ROAS tripled.&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">SN</div>
                    <div>
                      <p className="font-semibold text-sm">Siti Nabilah</p>
                      <p className="text-slate-500 text-xs">Digital Advertiser, Johor Bahru</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                  <Globe className="h-4 w-4" />
                  SME Owners
                </div>
                <h3 className="text-2xl font-bold mb-3">Understand how customers find you</h3>
                <p className="text-slate-600 leading-relaxed">
                  Whether you share links on WhatsApp Business, Instagram, or printed flyers with QR codes — Stackly tells you which channel drives the most customers to your door.
                </p>
              </div>
              <Card className="flex-1 border-emerald-200 bg-white shadow-sm">
                <CardContent className="pt-6">
                  <blockquote className="text-slate-700 italic leading-relaxed mb-4">
                    &ldquo;I run a kedai in Penang. I put a QR code on my flyer and in my WhatsApp status. Stackly told me the flyer got zero scans but WhatsApp got 200 clicks in one week. Game changer.&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">RA</div>
                    <div>
                      <p className="font-semibold text-sm">Rajan Arumugam</p>
                      <p className="text-slate-500 text-xs">SME Owner, Penang</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Pricing</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-500 text-lg">All prices in Malaysian Ringgit (MYR). Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Free</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-slate-900">RM0</span>
                  <span className="text-slate-500 text-sm ml-1">/month</span>
                </div>
                <CardDescription>Perfect to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Up to 20 active links", "Basic click analytics", "Custom slugs", "QR code per link"].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {feat}
                  </div>
                ))}
                {["Real-time data", "Device & country breakdown"].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm text-slate-400">
                    <X className="h-4 w-4 text-slate-300 flex-shrink-0" />
                    {feat}
                  </div>
                ))}
                <Link href="/signup" className="block pt-4">
                  <Button variant="outline" className="w-full border-slate-300">Get Started Free</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-violet-500 shadow-xl shadow-violet-100 scale-105 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-violet-600 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-md">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="pb-4 pt-8">
                <CardTitle className="text-xl">Pro</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-slate-900">RM29</span>
                  <span className="text-slate-500 text-sm ml-1">/month</span>
                </div>
                <CardDescription>For serious marketers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Unlimited active links",
                  "Real-time analytics",
                  "Country & device breakdown",
                  "Browser & referrer data",
                  "Custom slugs",
                  "QR codes for all links",
                  "Chrome extension",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />
                    {feat}
                  </div>
                ))}
                <Link href="/signup" className="block pt-4">
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200">
                    Start Pro — RM29/mo
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Business</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-slate-900">RM79</span>
                  <span className="text-slate-500 text-sm ml-1">/month</span>
                </div>
                <CardDescription>For agencies &amp; teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Everything in Pro",
                  "Team member access",
                  "Custom domain",
                  "API access",
                  "Priority support",
                  "Bulk link creation",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {feat}
                  </div>
                ))}
                <Link href="/signup" className="block pt-4">
                  <Button variant="outline" className="w-full border-slate-300">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Comparison</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Stackly vs Bitly</h2>
            <p className="text-slate-500">Why Malaysian marketers are switching.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full bg-white">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-5 text-slate-900 font-semibold text-sm w-2/5">Feature</th>
                  <th className="p-5 text-violet-600 font-bold text-sm text-center w-[30%]">
                    <div className="flex items-center justify-center gap-1.5">
                      <MousePointerClick className="h-4 w-4" />
                      Stackly
                    </div>
                  </th>
                  <th className="p-5 text-slate-400 font-semibold text-sm text-center w-[30%]">Bitly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: "Prices in MYR", stackly: true, bitly: false },
                  { feature: "Real-time analytics", stackly: true, bitly: true },
                  { feature: "Country breakdown", stackly: true, bitly: false },
                  { feature: "Device & browser data", stackly: true, bitly: false },
                  { feature: "Referrer tracking", stackly: true, bitly: false },
                  { feature: "Edit destination URL", stackly: true, bitly: true },
                  { feature: "QR code generation", stackly: true, bitly: true },
                  { feature: "Free plan available", stackly: true, bitly: true },
                  { feature: "Affordable Pro plan", stackly: true, bitly: false },
                  { feature: "PDPA compliant", stackly: true, bitly: false },
                  { feature: "Made in Malaysia 🇲🇾", stackly: true, bitly: false },
                ].map(({ feature, stackly, bitly }) => (
                  <tr key={feature} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 text-slate-700 text-sm">{feature}</td>
                    <td className="p-5 text-center">
                      {stackly ? (
                        <Check className="h-5 w-5 text-violet-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {bitly ? (
                        <Check className="h-5 w-5 text-slate-400 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-5">
              <Shield className="h-7 w-7 text-violet-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Your data is safe with us</h2>
            <p className="text-slate-400 text-lg">We take privacy seriously — especially for Malaysian businesses.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "No raw IPs stored",
                desc: "We record click patterns, not personal data. Your visitors' identities stay private.",
              },
              {
                icon: Check,
                title: "PDPA compliant",
                desc: "Built in compliance with Malaysia's Personal Data Protection Act 2010.",
              },
              {
                icon: Zap,
                title: "HTTPS everywhere",
                desc: "All links redirect over HTTPS. Your brand and your visitors are always protected.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently asked questions</h2>
            <p className="text-slate-500">Still have questions? Email us at hello@stackly.my</p>
          </div>
          <div className="space-y-0 divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
            {[
              {
                q: "Is Stackly really free to start?",
                a: "Yes. The Free plan gives you up to 20 active links with basic analytics — no credit card needed. You only upgrade when you need more links or deeper data.",
              },
              {
                q: "Can I change where a link goes after sharing it?",
                a: "Absolutely. You can edit the destination URL at any time from your dashboard. The short link stays the same, so you never have to reshare it.",
              },
              {
                q: "What does 'real-time' mean for analytics?",
                a: "Clicks appear in your dashboard within seconds. You can watch traffic roll in as you launch a campaign without refreshing or waiting for a daily report.",
              },
              {
                q: "Is Stackly PDPA compliant?",
                a: "Yes. We do not store raw IP addresses or any personally identifiable information from your link visitors. We capture aggregated analytics like country, device type, and browser only.",
              },
              {
                q: "Does Stackly work for WhatsApp marketing?",
                a: "Yes — and it works great. Paste your Stackly short link into any WhatsApp message, Broadcast, or Status. Each click is tracked with device and source data so you know exactly who engaged.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white">
                <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                  <span className="font-semibold text-slate-900 text-sm md:text-base">{q}</span>
                  <span className="text-slate-400 flex-shrink-0 transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Ready to know which links actually work?
          </h2>
          <p className="text-violet-100 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of Malaysian marketers who track smarter with Stackly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-white text-violet-700 hover:bg-violet-50 text-base px-10 py-6 rounded-xl font-semibold shadow-xl shadow-violet-900/30 transition-all">
                Start Free — No Credit Card Needed
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-10 py-6 rounded-xl border-white/40 text-white hover:bg-white/10 bg-transparent">
                Log in
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-violet-200 text-sm">
            🇲🇾 &nbsp;Trusted by <strong className="text-white">500+ marketers</strong> in Malaysia
          </p>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <MousePointerClick className="h-6 w-6 text-violet-400" />
                <span className="font-bold text-xl text-white">Stackly</span>
              </div>
              <p className="text-sm leading-relaxed">
                Track every click. Win every campaign. Built for Malaysian marketers.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-white font-semibold mb-3">Product</p>
                <div className="space-y-2">
                  <a href="#features" className="block hover:text-white transition-colors">Features</a>
                  <a href="#pricing" className="block hover:text-white transition-colors">Pricing</a>
                  <a href="#faq" className="block hover:text-white transition-colors">FAQ</a>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Account</p>
                <div className="space-y-2">
                  <Link href="/login" className="block hover:text-white transition-colors">Log in</Link>
                  <Link href="/signup" className="block hover:text-white transition-colors">Sign up free</Link>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Legal</p>
                <div className="space-y-2">
                  <Link href="/privacy" className="block hover:text-white transition-colors">Privacy Policy</Link>
                  <Link href="/terms" className="block hover:text-white transition-colors">Terms of Service</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>Stackly — Track every click. Win every campaign.</p>
            <p>© 2026 Stackly. Made in Malaysia 🇲🇾</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
