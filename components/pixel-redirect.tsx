'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface PixelRedirectProps {
  destinationUrl: string
  pixelFb: string | null
  pixelGa: string | null
  pixelGtm: string | null
  pixelGads: string | null
  pixelTiktok: string | null
}

function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9\-_\/\.]/g, '')
}

export function PixelRedirect({
  destinationUrl,
  pixelFb,
  pixelGa,
  pixelGtm,
  pixelGads,
  pixelTiktok,
}: PixelRedirectProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = destinationUrl
    }, 800)
    return () => clearTimeout(timer)
  }, [destinationUrl])

  const fb = pixelFb ? sanitize(pixelFb) : null
  const ga = pixelGa ? sanitize(pixelGa) : null
  const gtm = pixelGtm ? sanitize(pixelGtm) : null
  const gads = pixelGads ? sanitize(pixelGads) : null
  const tiktok = pixelTiktok ? sanitize(pixelTiktok) : null

  // For Google Ads, split on "/" to get the account ID part
  const gadsId = gads ? gads.split('/')[0] : null

  return (
    <>
      {/* Facebook Pixel */}
      {fb && (
        <Script id="fb-pixel" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${fb}');
fbq('track', 'PageView');
        `}</Script>
      )}

      {/* Google Analytics 4 */}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`}</Script>
        </>
      )}

      {/* Google Tag Manager */}
      {gtm && (
        <Script id="gtm-init" strategy="afterInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');
        `}</Script>
      )}

      {/* Google Ads */}
      {gads && gadsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gadsId}`} strategy="afterInteractive" />
          <Script id="gads-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gadsId}');gtag('event','conversion',{'send_to':'${gads}'});`}</Script>
        </>
      )}

      {/* TikTok Pixel */}
      {tiktok && (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktok}');ttq.page();}(window, document, 'ttq');
        `}</Script>
      )}

      {/* Loading page */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          {/* Spinner */}
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-lg font-semibold text-foreground">Redirecting...</p>
            <p className="text-sm text-muted-foreground">You will be taken to your destination shortly.</p>
          </div>

          {/* Stackly branding */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Powered by</span>
            <span className="font-semibold text-foreground">Stackly</span>
          </div>
        </div>
      </div>
    </>
  )
}
