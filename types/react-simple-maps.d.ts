declare module 'react-simple-maps' {
  import * as React from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    width?: number
    height?: number
    style?: React.CSSProperties
    children?: React.ReactNode
  }
  export const ComposableMap: React.FC<ComposableMapProps>

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: Geography[] }) => React.ReactNode
  }
  export const Geographies: React.FC<GeographiesProps>

  export interface Geography {
    rsmKey: string
    id: string
    properties: Record<string, unknown>
    type: string
    geometry: object
  }

  export interface GeographyProps {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: { default?: object; hover?: object; pressed?: object }
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseMove?: (event: React.MouseEvent<SVGPathElement>) => void
  }
  export const Geography: React.FC<GeographyProps>
}
