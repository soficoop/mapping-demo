import type { POI, Route, Area } from "./types"

export const DEFAULT_CENTER: [number, number] = [31.7767, 35.2244] // Center of Old City / Jerusalem area
export const DEFAULT_ZOOM = 14

export const INITIAL_POIS: POI[] = [
  {
    id: "poi-western-wall",
    name: "Western Wall",
    category: "Culture & Religion",
    description:
      "One of the most sacred sites in Judaism, located in the Old City of Jerusalem.",
    lat: 31.7767,
    lng: 35.2345,
    color: "#eab308", // Yellow-500
    icon: "landmark",
  },
  {
    id: "poi-holy-sepulchre",
    name: "Church of the Holy Sepulchre",
    category: "Culture & Religion",
    description:
      "A major Christian pilgrimage site in the Christian Quarter of the Old City.",
    lat: 31.7784,
    lng: 35.2298,
    color: "#3b82f6", // Blue-500
    icon: "church",
  },
  {
    id: "poi-dome-rock",
    name: "Dome of the Rock",
    category: "Culture & Religion",
    description:
      "An iconic Islamic shrine situated on the Temple Mount in the Old City.",
    lat: 31.778,
    lng: 35.2354,
    color: "#10b981", // Emerald-500
    icon: "dome",
  },
  {
    id: "poi-jaffa-gate",
    name: "Jaffa Gate",
    category: "Culture & Religion",
    description:
      "One of the main historical gates of the Old City of Jerusalem.",
    lat: 31.7762,
    lng: 35.2276,
    color: "#f97316", // Orange-500
    icon: "gate",
  },
  {
    id: "poi-machane-yehuda",
    name: "Machane Yehuda Market",
    category: "Food & Drink",
    description:
      "A bustling marketplace filled with stalls, cafes, bars, and restaurants. Famous for its daytime shopping and nightlife.",
    lat: 31.7852,
    lng: 35.2124,
    color: "#ef4444", // Red-500
    icon: "utensils",
  },
  {
    id: "poi-sacher-park",
    name: "Sacher Park",
    category: "Nature & Parks",
    description:
      "Jerusalem's largest public park, featuring expansive lawns, playgrounds, sports fields, and walking trails.",
    lat: 31.781,
    lng: 35.2085,
    color: "#22c55e", // Green-500
    icon: "trees",
  },
  {
    id: "poi-israel-museum",
    name: "The Israel Museum",
    category: "Culture & Religion",
    description:
      "Israel's largest cultural institution, housing the Dead Sea Scrolls and rich archaeological collections.",
    lat: 31.7725,
    lng: 35.2015,
    color: "#a855f7", // Purple-500
    icon: "museum",
  },
  {
    id: "poi-yemin-moshe",
    name: "Yemin Moshe Windmill",
    category: "Nature & Parks",
    description:
      "A historic windmill and charming neighborhood overlooking Mount Zion and the Old City walls.",
    lat: 31.7716,
    lng: 35.2244,
    color: "#14b8a6", // Teal-500
    icon: "wind",
  },
]

export const INITIAL_ROUTES: Route[] = [
  {
    id: "route-ramparts",
    name: "Old City South Ramparts Walk",
    description:
      "An elevated scenic walk along the historic southern Ottoman walls of the Old City, from Jaffa Gate to Zion Gate and Dung Gate.",
    coordinates: [
      [31.7762, 35.2276], // Jaffa Gate
      [31.7745, 35.2275],
      [31.7722, 35.2291], // Zion Gate
      [31.7725, 35.2312],
      [31.7735, 35.2332], // Dung Gate
    ],
    color: "#e11d48", // Rose-600
    weight: 5,
  },
  {
    id: "route-ben-yehuda",
    name: "Ben Yehuda Pedestrian Mall Walk",
    description:
      "A popular pedestrian street in downtown Jerusalem, paved with stone and lined with stores and cafes.",
    coordinates: [
      [31.7816, 35.2185], // Top of Ben Yehuda
      [31.781, 35.2192],
      [31.7803, 35.2198], // Junction with Zion Square
    ],
    color: "#2563eb", // Blue-600
    weight: 4,
  },
]

export const INITIAL_AREAS: Area[] = [
  {
    id: "area-old-city",
    name: "The Old City of Jerusalem",
    description:
      "A 0.9-square-kilometer walled area within the modern city of Jerusalem, home to key religious and historical landmarks.",
    coordinates: [
      [31.7789, 35.2253], // Northwest corner (New Gate)
      [31.782, 35.2312], // Northeast corner (Damascus/Herod's Gate)
      [31.7794, 35.2374], // East corner (Lion's Gate)
      [31.772, 35.2355], // Southeast corner (Dung Gate)
      [31.7718, 35.2294], // Southwest corner (Zion Gate)
      [31.7762, 35.2276], // West Gate (Jaffa Gate)
    ],
    color: "#fbbf24", // Amber-400
  },
  {
    id: "area-sacher-park",
    name: "Sacher Park District",
    description:
      "A major green space and recreation hub west of the Old City, serving as a peaceful refuge for residents and visitors.",
    coordinates: [
      [31.783, 35.2085],
      [31.782, 35.211],
      [31.779, 35.2085],
      [31.7805, 35.206],
    ],
    color: "#4ade80", // Green-400
  },
]
