export interface POI {
  id: string
  name: string
  category: string
  description: string
  lat: number
  lng: number
  color: string
  icon?: string
  areaId?: string // Automatically computed if inside an area
}

export interface Route {
  id: string
  name: string
  description: string
  coordinates: [number, number][] // [lat, lng]
  color: string
  weight: number
}

export interface Area {
  id: string
  name: string
  description: string
  coordinates: [number, number][] // [lat, lng]
  color: string
  borderColor?: string
  fillColor?: string
  fillOpacity?: number // 0 to 1
  strokeWeight?: number // 1 to 10
  borderStyle?: "solid" | "dashed" | "dotted" | "none"
  blendMode?: "normal" | "color" | "multiply" | "overlay"
  glowEffect?: boolean
  filters?: {
    grayscale: number
    invert: number
    hueRotate: number
    brightness: number
    contrast: number
    saturation: number
    sepia: number
    opacity: number
    enabled: boolean
  }
}

export type DrawingMode = "idle" | "add-poi" | "add-route" | "add-area"

export interface MapState {
  center: [number, number] // [lat, lng]
  zoom: number
  activeBasemap: string
  activeOverlays: string[]
  library: "leaflet" | "maplibre"
  clusterMode: "none" | "maplibre-native" | "area-polygons"
}

export interface BasemapFilters {
  grayscale: number // 0 to 100
  invert: number // 0 to 100
  hueRotate: number // 0 to 360
  brightness: number // 50 to 150
  contrast: number // 50 to 150
  saturation: number // 0 to 200
  sepia: number // 0 to 100
  opacity: number // 0 to 100
}
