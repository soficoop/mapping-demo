export interface BaseMapProvider {
  id: string
  name: string
  category:
    | "OSM"
    | "Commercial (Free Tier)"
    | "Satellite & Topo"
    | "Vector Style"
    | "Custom Basemaps"
  attribution: string
  url?: string // Raster tile URL for Leaflet
  styleUrl?: string // MapLibre vector style URL (if vector)
  description: string
  isVector?: boolean
}

export interface OverlayProvider {
  id: string
  name: string
  url: string
  attribution: string
  description: string
  color: string
}

export const BASEMAPS: BaseMapProvider[] = [
  {
    id: "osm-standard",
    name: "OpenStreetMap Standard",
    category: "OSM",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    description:
      "The classic community-driven map. Great for general purposes and rich street-level detail.",
  },
  {
    id: "osm-hot",
    name: "OSM Humanitarian (HOT)",
    category: "OSM",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, Tiles style by <a href="https://hotosm.org/" target="_blank">HOT</a>',
    description:
      "High-contrast map focused on social/humanitarian details, road quality, and local infrastructure.",
  },
  {
    id: "cyclosm",
    name: "CyclOSM",
    category: "OSM",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attribution:
      '&copy; CyclOSM contributors &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    description:
      "Designed specifically for cyclists, highlighting cycleways, bike parking, and elevation lines.",
  },
  {
    id: "hikebike",
    name: "OSM HikeBike Map",
    category: "OSM",
    url: "https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, HikeBike Map style',
    description:
      "An outdoor-focused layout showcasing hiking paths, cycling routes, and topographic contour lines.",
  },
  {
    id: "opentopomap",
    name: "OpenTopoMap",
    category: "Satellite & Topo",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org" target="_blank">OpenTopoMap</a> (CC-BY-SA)',
    description:
      "Beautiful topographic map showcasing contours, elevation shading, and forests.",
  },
  {
    id: "carto-positron",
    name: "CartoDB Positron (Light)",
    category: "Commercial (Free Tier)",
    url: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    description:
      "A very clean, minimal light-colored map. Perfect for overlaying colorful POIs and routes.",
  },
  {
    id: "carto-darkmatter",
    name: "CartoDB Dark Matter (Dark)",
    category: "Commercial (Free Tier)",
    url: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    description:
      "A minimal, dark-themed base map that makes bright indicators, trails, and shapes stand out.",
  },
  {
    id: "carto-voyager",
    name: "CartoDB Voyager",
    category: "Commercial (Free Tier)",
    url: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    description:
      "A colorful, modern base map with soft rendering suitable for general public web apps.",
  },
  {
    id: "esri-world-imagery",
    name: "Esri World Imagery (Satellite)",
    category: "Satellite & Topo",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    description:
      "High-resolution global satellite imagery. Great for recognizing actual buildings, parks, and topography.",
  },
  {
    id: "esri-topo",
    name: "Esri World Topographic Map",
    category: "Satellite & Topo",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Sources: Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), &copy; OpenStreetMap contributors, and the GIS User Community",
    description:
      "Esri's clean topographic map style with physical features, boundaries, and labels.",
  },
  {
    id: "openfreemap-liberty",
    name: "OpenFreeMap Liberty (Vector)",
    category: "Vector Style",
    styleUrl: "https://tiles.openfreemap.org/styles/liberty",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; OpenFreeMap',
    description:
      "A gorgeous, high-performance vector map styled with sharp labels and icons. (Requires MapLibre GL for full vector rendering; Leaflet falls back to a proxy raster/vector tile layer).",
    isVector: true,
  },
  {
    id: "openfreemap-bright",
    name: "OpenFreeMap Bright (Vector)",
    category: "Vector Style",
    styleUrl: "https://tiles.openfreemap.org/styles/bright",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; OpenFreeMap',
    description:
      "Clear and highly readable vector style focusing on public transport and roads. (Requires MapLibre GL for full vector rendering).",
    isVector: true,
  },
  {
    id: "openfreemap-positron",
    name: "OpenFreeMap Positron (Vector)",
    category: "Vector Style",
    styleUrl: "https://tiles.openfreemap.org/styles/positron",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; OpenFreeMap',
    description:
      "Super light-gray vector style designed for neat overlay presentation. (Requires MapLibre GL for full vector rendering).",
    isVector: true,
  },
]

export const OVERLAYS: OverlayProvider[] = [
  {
    id: "hiking-routes",
    name: "Hiking Trails (Waymarked)",
    url: "https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://hiking.waymarkedtrails.org" target="_blank">Waymarked Trails</a>',
    description:
      "Semi-transparent overlay displaying hiking routes and markers globally from OpenStreetMap data.",
    color: "#E21B1B",
  },
  {
    id: "cycling-routes",
    name: "Cycling Trails (Waymarked)",
    url: "https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://cycling.waymarkedtrails.org" target="_blank">Waymarked Trails</a>',
    description:
      "Overlay highlighting local, regional, and national cycling paths.",
    color: "#1B5CE2",
  },
  {
    id: "mtb-routes",
    name: "Mountain Bike (MTB) Trails",
    url: "https://tile.waymarkedtrails.org/mtb/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://mtb.waymarkedtrails.org" target="_blank">Waymarked Trails</a>',
    description:
      "Highlighting technical off-road tracks, downhill runs, and mountain biking courses globally.",
    color: "#E26F1B",
  },
  {
    id: "equestrian-routes",
    name: "Equestrian/Riding Trails",
    url: "https://tile.waymarkedtrails.org/riding/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://riding.waymarkedtrails.org" target="_blank">Waymarked Trails</a>',
    description:
      "Overlay marking dedicated bridleways, horse-riding paths, and equestrian routes.",
    color: "#8B5A2B",
  },
  {
    id: "opnv-transport",
    name: "Public Transport Map (ÖPNV)",
    url: "https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png",
    attribution:
      'Tiles &copy; <a href="https://memomaps.de" target="_blank">ÖPNV Karte</a>, Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    description:
      "Highly detailed community transit overlay showing bus routes, metro lines, train stations, and stops.",
    color: "#6D28D9",
  },
  {
    id: "openrailwaymap",
    name: "OpenRailwayMap",
    url: "https://a.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openrailwaymap.org" target="_blank">OpenRailwayMap</a> contributors',
    description:
      "Detailed overlay showing global rail networks, tracks, and infrastructure details.",
    color: "#E2931B",
  },
  {
    id: "openseamap",
    name: "OpenSeaMap Marine",
    url: "https://tiles.openseamap.org/seamap/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openseamap.org" target="_blank">OpenSeaMap</a>',
    description:
      "Marine navigation overlay showing lighthouses, buoys, and shipping routes.",
    color: "#1BE2CA",
  },
]
