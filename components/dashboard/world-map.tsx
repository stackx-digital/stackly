'use client'

import { useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ISO 3166-1 numeric → alpha-2 (unique entries only)
const NUM_TO_A2: Record<string, string> = {
  "4":"AF","8":"AL","12":"DZ","20":"AD","24":"AO","28":"AG","32":"AR","36":"AU",
  "40":"AT","44":"BS","48":"BH","50":"BD","52":"BB","56":"BE","64":"BT","68":"BO",
  "70":"BA","72":"BW","76":"BR","84":"BZ","96":"BN","100":"BG","104":"MM",
  "108":"BI","116":"KH","120":"CM","124":"CA","140":"CF","144":"LK",
  "148":"TD","152":"CL","156":"CN","158":"TW","170":"CO","178":"CG","180":"CD",
  "188":"CR","191":"HR","192":"CU","196":"CY","203":"CZ","204":"BJ","208":"DK",
  "214":"DO","218":"EC","222":"SV","226":"GQ","231":"ET","233":"EE","242":"FJ",
  "246":"FI","250":"FR","266":"GA","270":"GM","276":"DE","288":"GH","300":"GR",
  "308":"GD","320":"GT","324":"GN","328":"GY","332":"HT","340":"HN","348":"HU",
  "356":"IN","360":"ID","364":"IR","368":"IQ","372":"IE","376":"IL","380":"IT",
  "388":"JM","392":"JP","400":"JO","404":"KE","408":"KP","410":"KR","414":"KW",
  "418":"LA","422":"LB","428":"LV","430":"LR","434":"LY","440":"LT","442":"LU",
  "450":"MG","454":"MW","458":"MY","462":"MV","466":"ML","484":"MX","496":"MN",
  "498":"MD","499":"ME","504":"MA","508":"MZ","516":"NA","524":"NP","528":"NL",
  "554":"NZ","558":"NI","562":"NE","566":"NG","578":"NO","586":"PK",
  "591":"PA","598":"PG","600":"PY","604":"PE","608":"PH","616":"PL","620":"PT",
  "624":"GW","634":"QA","642":"RO","643":"RU","646":"RW","678":"ST","682":"SA",
  "686":"SN","688":"RS","694":"SL","702":"SG","703":"SK","704":"VN","705":"SI",
  "706":"SO","710":"ZA","716":"ZW","724":"ES","728":"SS","736":"SD","740":"SR",
  "752":"SE","756":"CH","760":"SY","762":"TJ","764":"TH","768":"TG","776":"TO",
  "780":"TT","784":"AE","788":"TN","792":"TR","800":"UG","804":"UA","807":"MK",
  "826":"GB","834":"TZ","840":"US","858":"UY","860":"UZ","862":"VE","882":"WS",
  "887":"YE","894":"ZM",
}

const A2_TO_NAME: Record<string, string> = {
  MY:"Malaysia",SG:"Singapore",ID:"Indonesia",TH:"Thailand",PH:"Philippines",
  VN:"Vietnam",MM:"Myanmar",KH:"Cambodia",LA:"Laos",BN:"Brunei",TW:"Taiwan",
  US:"United States",GB:"United Kingdom",AU:"Australia",CA:"Canada",NZ:"New Zealand",
  IN:"India",CN:"China",JP:"Japan",KR:"South Korea",HK:"Hong Kong",
  DE:"Germany",FR:"France",IT:"Italy",ES:"Spain",NL:"Netherlands",
  BR:"Brazil",MX:"Mexico",AR:"Argentina",CO:"Colombia",CL:"Chile",PY:"Paraguay",
  SA:"Saudi Arabia",AE:"UAE",QA:"Qatar",KW:"Kuwait",BH:"Bahrain",
  EG:"Egypt",ZA:"South Africa",NG:"Nigeria",KE:"Kenya",GH:"Ghana",
  TR:"Turkey",RU:"Russia",UA:"Ukraine",PL:"Poland",CZ:"Czechia",
  PK:"Pakistan",BD:"Bangladesh",LK:"Sri Lanka",NP:"Nepal",
}

interface WorldMapProps {
  countryStats: { country: string; count: number }[]
}

export function WorldMap({ countryStats }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; count: number; x: number; y: number } | null>(null)

  const maxCount = Math.max(...countryStats.map((c) => c.count), 1)
  const countryMap = Object.fromEntries(countryStats.map((c) => [c.country, c.count]))

  function getColor(geoId: string): string {
    const alpha2 = NUM_TO_A2[geoId]
    if (!alpha2) return '#e2e8f0'
    const count = countryMap[alpha2]
    if (!count) return '#e2e8f0'
    const intensity = count / maxCount
    if (intensity > 0.75) return '#6d28d9'
    if (intensity > 0.5) return '#7c3aed'
    if (intensity > 0.25) return '#a78bfa'
    return '#ddd6fe'
  }

  function handleEnter(geoId: string, e: React.MouseEvent) {
    const alpha2 = NUM_TO_A2[geoId]
    if (!alpha2) return
    const count = countryMap[alpha2]
    if (!count) return
    setTooltip({ name: A2_TO_NAME[alpha2] || alpha2, count, x: e.clientX, y: e.clientY })
  }

  return (
    <div
      className="relative w-full"
      onMouseMove={(e) => setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
      onMouseLeave={() => setTooltip(null)}
    >
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 147 }}
        width={800}
        height={420}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={getColor(geo.id)}
                stroke="#ffffff"
                strokeWidth={0.4}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', opacity: 0.8, cursor: 'pointer' },
                  pressed: { outline: 'none' },
                }}
                onMouseEnter={(e) => handleEnter(geo.id, e)}
                onMouseLeave={() => setTooltip(null)}
              />
            ))
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-popover px-3 py-1.5 text-sm shadow-md border"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <span className="font-semibold">{tooltip.name}</span>
          <span className="text-muted-foreground ml-2">{tooltip.count.toLocaleString()} clicks</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 justify-end mt-2 pr-1">
        <span className="text-xs text-muted-foreground mr-1">Fewer</span>
        {['#ddd6fe', '#a78bfa', '#7c3aed', '#6d28d9'].map((c) => (
          <div key={c} className="h-3 w-6 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-xs text-muted-foreground ml-1">More</span>
      </div>
    </div>
  )
}
