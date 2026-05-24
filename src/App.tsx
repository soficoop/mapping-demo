import { useState, useEffect, useRef } from "react"
import {
  Compass,
  Trash2,
  Undo2,
  Check,
  X,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Layers2,
  FolderTree,
  FileCode2,
} from "lucide-react"
import { BASEMAPS, OVERLAYS } from "@/lib/providers"
import type { POI, Route, Area, DrawingMode } from "@/lib/types"
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  INITIAL_POIS,
  INITIAL_ROUTES,
  INITIAL_AREAS,
} from "@/lib/mockData"
import {
  stateToGeoJSON,
  geoJSONToState,
  generateLeafletCode,
  generateMapLibreCode,
  isPointInPolygon,
} from "@/lib/geoUtils"
import { UnifiedMap, getCategoryDetails } from "@/components/UnifiedMap"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"

export function App() {
  // --- Persistent Local Database State ---
  const [pois, setPois] = useState<POI[]>(() => {
    const saved = localStorage.getItem("mapping_demo_pois")
    return saved ? JSON.parse(saved) : INITIAL_POIS
  })

  const [routes, setRoutes] = useState<Route[]>(() => {
    const saved = localStorage.getItem("mapping_demo_routes")
    return saved ? JSON.parse(saved) : INITIAL_ROUTES
  })

  const [areas, setAreas] = useState<Area[]>(() => {
    const saved = localStorage.getItem("mapping_demo_areas")
    return saved ? JSON.parse(saved) : INITIAL_AREAS
  })

  // --- Configuration State ---
  const [library, setLibrary] = useState<"leaflet" | "maplibre">("leaflet")
  const [activeBasemap, setActiveBasemap] = useState<string>("osm-standard")
  const [activeOverlays, setActiveOverlays] = useState<string[]>([])
  const [clusterMode, setClusterMode] = useState<
    "none" | "maplibre-native" | "area-polygons"
  >("none")

  // --- Map Positioning State ---
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM)

  // --- Drawing State ---
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("idle")
  const [tempCoordinates, setTempCoordinates] = useState<[number, number][]>([])

  // --- Active Tab State ---
  const [activeTab, setActiveTab] = useState<
    "design" | "elements" | "clusters" | "developer"
  >("design")

  // --- Form States for Saving Features ---
  const [showPoiForm, setShowPoiForm] = useState(false)
  const [poiFormCoords, setPoiFormCoords] = useState<[number, number] | null>(
    null
  )
  const [poiName, setPoiName] = useState("")
  const [poiCategory, setPoiCategory] = useState("Culture & Religion")
  const [poiDescription, setPoiDescription] = useState("")
  const [poiColor, setPoiColor] = useState("#3b82f6")

  const [showShapeForm, setShowShapeForm] = useState(false)
  const [shapeName, setShapeName] = useState("")
  const [shapeDescription, setShapeDescription] = useState("")
  const [shapeColor, setShapeColor] = useState("#ef4444")
  const [routeWeight, setRouteWeight] = useState(4)

  // File Input Ref for Import GeoJSON
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Sync database with LocalStorage ---
  useEffect(() => {
    localStorage.setItem("mapping_demo_pois", JSON.stringify(pois))
  }, [pois])

  useEffect(() => {
    localStorage.setItem("mapping_demo_routes", JSON.stringify(routes))
  }, [routes])

  useEffect(() => {
    localStorage.setItem("mapping_demo_areas", JSON.stringify(areas))
  }, [areas])

  // --- Theme State (Sync with tailwind template) ---
  // Sync dark mode shortcut key 'd'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d" && e.target === document.body) {
        document.documentElement.classList.toggle("dark")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // --- Drawing Actions ---
  const handleMapClick = (lat: number, lng: number) => {
    if (drawingMode === "add-poi") {
      setPoiFormCoords([lat, lng])
      setPoiName("")
      setPoiDescription("")
      setPoiColor("#3b82f6")
      setShowPoiForm(true)
      setDrawingMode("idle")
    } else if (drawingMode === "add-route" || drawingMode === "add-area") {
      setTempCoordinates((prev) => [...prev, [lat, lng]])
    }
  }

  const handleUndoDrawPoint = () => {
    setTempCoordinates((prev) => prev.slice(0, -1))
  }

  const handleCompleteShapeDrawing = () => {
    if (tempCoordinates.length < 2) {
      alert("Please place at least 2 points on the map first!")
      return
    }
    setShapeName("")
    setShapeDescription("")
    setShapeColor(drawingMode === "add-route" ? "#dc2626" : "#22c55e")
    setShowShapeForm(true)
  }

  const handleCancelDrawing = () => {
    setDrawingMode("idle")
    setTempCoordinates([])
  }

  // --- Save Handlers ---
  const handleSavePoi = (e: React.FormEvent) => {
    e.preventDefault()
    if (!poiName.trim() || !poiFormCoords) return

    const newPoi: POI = {
      id: `poi-${Date.now()}`,
      name: poiName,
      category: poiCategory,
      description: poiDescription,
      lat: poiFormCoords[0],
      lng: poiFormCoords[1],
      color: poiColor,
    }

    setPois((prev) => [...prev, newPoi])
    setShowPoiForm(false)
    setPoiFormCoords(null)
  }

  const handleSaveShape = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shapeName.trim()) return

    if (drawingMode === "add-route") {
      const newRoute: Route = {
        id: `route-${Date.now()}`,
        name: shapeName,
        description: shapeDescription,
        coordinates: tempCoordinates,
        color: shapeColor,
        weight: routeWeight,
      }
      setRoutes((prev) => [...prev, newRoute])
    } else if (drawingMode === "add-area") {
      const newArea: Area = {
        id: `area-${Date.now()}`,
        name: shapeName,
        description: shapeDescription,
        coordinates: tempCoordinates,
        color: shapeColor,
      }
      setAreas((prev) => [...prev, newArea])
    }

    setShowShapeForm(false)
    setTempCoordinates([])
    setDrawingMode("idle")
  }

  // --- Delete Handlers ---
  const handleDeletePoi = (id: string) => {
    setPois((prev) => prev.filter((p) => p.id !== id))
  }

  const handleDeleteRoute = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id))
  }

  const handleDeleteArea = (id: string) => {
    setAreas((prev) => prev.filter((a) => a.id !== id))
  }

  // --- Database Portability ---
  const handleResetToDefaults = () => {
    if (
      confirm(
        "Are you sure you want to reset all features back to the default Jerusalem mock data? Your local edits will be overwritten."
      )
    ) {
      setPois(INITIAL_POIS)
      setRoutes(INITIAL_ROUTES)
      setAreas(INITIAL_AREAS)
      setActiveBasemap("osm-standard")
      setActiveOverlays([])
      setClusterMode("none")
      setCenter(DEFAULT_CENTER)
      setZoom(DEFAULT_ZOOM)
    }
  }

  const handleExportGeoJSON = () => {
    const geojson = stateToGeoJSON(pois, routes, areas)
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `community-map-export-${Date.now()}.geojson`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportGeoJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        const {
          pois: importedPois,
          routes: importedRoutes,
          areas: importedAreas,
        } = geoJSONToState(json)

        if (
          importedPois.length ||
          importedRoutes.length ||
          importedAreas.length
        ) {
          setPois((prev) => [...prev, ...importedPois])
          setRoutes((prev) => [...prev, ...importedRoutes])
          setAreas((prev) => [...prev, ...importedAreas])
          alert(
            `Successfully imported: ${importedPois.length} POIs, ${importedRoutes.length} Routes, and ${importedAreas.length} Areas!`
          )
        } else {
          alert(
            "No compatible community map features (POIs, Routes, or Areas) found in this GeoJSON."
          )
        }
      } catch (err) {
        alert(
          "Error parsing GeoJSON. Please make sure it is a valid GeoJSON file."
        )
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = "" // clear
  }

  // --- Calculate point-in-polygon Area Clusters for Summary Tab ---
  const getAreaClustersBreakdown = () => {
    return areas.map((area) => {
      const insidePois = pois.filter((poi) =>
        isPointInPolygon([poi.lat, poi.lng], area.coordinates)
      )

      const categoryCounts = insidePois.reduce(
        (acc: { [cat: string]: number }, cur) => {
          acc[cur.category] = (acc[cur.category] || 0) + 1
          return acc
        },
        {}
      )

      return {
        area,
        pois: insidePois,
        categories: categoryCounts,
      }
    })
  }

  const areaClusters = getAreaClustersBreakdown()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* LEFT SIDEBAR (Controls & Data Management) */}
      <aside className="z-10 flex h-full w-[440px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Playground Header */}
        <div className="border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Logo iconSize={32} usePng={true} />
            <div className="flex shrink-0 gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Reset Map to Defaults"
                onClick={handleResetToDefaults}
              >
                <RotateCcw className="h-4 w-4 text-slate-500" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Export GeoJSON"
                onClick={handleExportGeoJSON}
              >
                <Download className="h-4 w-4 text-slate-500" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Import GeoJSON"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 text-slate-500" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportGeoJSON}
                accept=".geojson,.json"
                className="hidden"
              />
            </div>
          </div>
          <p className="text-xs leading-normal text-slate-500 dark:text-slate-400">
            Compare Leaflet vs MapLibre GL side-by-side. Choose base maps, add
            trail overlays, draw and cluster community POIs in Jerusalem.
          </p>
        </div>

        {/* Tab Selection Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950/20">
          <button
            onClick={() => {
              setActiveTab("design")
              setDrawingMode("idle")
            }}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeTab === "design"
                ? "border border-slate-200 bg-white text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Layers2 className="h-4 w-4" />
            <span>Map Style</span>
          </button>
          <button
            onClick={() => setActiveTab("elements")}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeTab === "elements"
                ? "border border-slate-200 bg-white text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Draw Tools</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("clusters")
              setDrawingMode("idle")
            }}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeTab === "clusters"
                ? "border border-slate-200 bg-white text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FolderTree className="h-4 w-4" />
            <span>Clusters</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("developer")
              setDrawingMode("idle")
            }}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeTab === "developer"
                ? "border border-slate-200 bg-white text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileCode2 className="h-4 w-4" />
            <span>Code Dev</span>
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* TAB 1: DESIGN MAP (Basemaps & Overlays) */}
          {activeTab === "design" && (
            <div className="animate-fade-in space-y-6">
              {/* Library Framework Switcher */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <label className="mb-2 block text-xs font-extrabold tracking-wider text-blue-800 uppercase dark:text-blue-400">
                  1. Map Framework Library
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLibrary("leaflet")}
                    className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                      library === "leaflet"
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    Leaflet JS (~40KB)
                  </button>
                  <button
                    onClick={() => setLibrary("maplibre")}
                    className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                      library === "maplibre"
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    MapLibre GL (~250KB)
                  </button>
                </div>
                <div className="mt-2 text-[11px] leading-normal text-slate-500">
                  {library === "leaflet" ? (
                    <span>
                      💡 <b>Leaflet</b> is raster-based, highly modular, fast
                      loading, and extremely mature. Standard DOM markers.
                    </span>
                  ) : (
                    <span>
                      ⚡ <b>MapLibre GL</b> utilizes GPU WebGL for vector tiles.
                      Supports smooth rotating, 3D pitching, and rendering
                      massive datasets.
                    </span>
                  )}
                </div>
              </div>

              {/* Base Map Select */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  2. Select Basemap Provider
                </label>

                {/* Group basemaps by Category */}
                {(
                  [
                    "OSM",
                    "Vector Style",
                    "Satellite & Topo",
                    "Commercial (Free Tier)",
                  ] as const
                ).map((cat) => {
                  const filtered = BASEMAPS.filter((b) => b.category === cat)
                  if (filtered.length === 0) return null

                  return (
                    <div key={cat} className="space-y-2">
                      <h4 className="pt-1 text-[11px] font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                        {cat}
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {filtered.map((b) => {
                          const isActive = activeBasemap === b.id
                          const isDisabledVector =
                            b.isVector && library === "leaflet"

                          return (
                            <button
                              key={b.id}
                              onClick={() => {
                                if (isDisabledVector) return
                                setActiveBasemap(b.id)
                              }}
                              className={`relative flex flex-col justify-between rounded-lg border p-3 text-left transition-all ${
                                isActive
                                  ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500 dark:bg-indigo-950/20"
                                  : isDisabledVector
                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-50 dark:border-slate-800 dark:bg-slate-900/60"
                                    : "cursor-pointer border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                              }`}
                            >
                              <div className="flex w-full items-center justify-between">
                                <span className="text-xs font-semibold">
                                  {b.name}
                                </span>
                                {b.isVector && (
                                  <span className="rounded bg-indigo-100/50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 uppercase dark:bg-indigo-900/30 dark:text-indigo-400">
                                    Vector Style
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                                {b.description}
                              </p>
                              {isDisabledVector && (
                                <p className="mt-1 text-[9px] font-semibold text-rose-500">
                                  ⚠️ Requires MapLibre GL. Switch framework to
                                  enable.
                                </p>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Overlays (Layers on Top) */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  3. Select Topography Overlays
                </label>
                <div className="space-y-2">
                  {OVERLAYS.map((over) => {
                    const isActive = activeOverlays.includes(over.id)

                    return (
                      <button
                        key={over.id}
                        onClick={() => {
                          setActiveOverlays((prev) =>
                            prev.includes(over.id)
                              ? prev.filter((id) => id !== over.id)
                              : [...prev, over.id]
                          )
                        }}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                          isActive
                            ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        }`}
                      >
                        <div
                          className="h-4 w-4 shrink-0 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: over.color }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">
                              {over.name}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Raster Overlay
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            {over.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* POIs Clustering Configuration */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  4. POI Clustering Strategy
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setClusterMode("none")}
                    className={`cursor-pointer rounded-lg border p-3 text-left transition-all ${
                      clusterMode === "none"
                        ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <div className="text-xs font-semibold">No Clustering</div>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      Show all individual markers at their exact locations on
                      all zooms.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      if (library === "leaflet") {
                        alert(
                          "Native Grid-clustering is configured via MapLibre GL source engine. Toggle MapLibre GL to test dynamic grid-based WebGL clustering!"
                        )
                        return
                      }
                      setClusterMode("maplibre-native")
                    }}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      library === "leaflet"
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-50 dark:border-slate-800 dark:bg-slate-900/60"
                        : clusterMode === "maplibre-native"
                          ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                          : "cursor-pointer border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        Grid-based Native Clustering
                      </span>
                      {library === "leaflet" && (
                        <span className="rounded bg-rose-50 px-1 text-[9px] font-bold text-rose-500 uppercase">
                          MapLibre Only
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] leading-normal text-slate-500 dark:text-slate-400">
                      High-performance WebGL clustering with numbered counts and
                      dynamic boundaries.
                    </p>
                  </button>

                  <button
                    onClick={() => setClusterMode("area-polygons")}
                    className={`cursor-pointer rounded-lg border p-3 text-left transition-all ${
                      clusterMode === "area-polygons"
                        ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <div className="text-xs font-semibold">
                      Custom Polygon Area Clustering
                    </div>
                    <p className="mt-0.5 text-[10px] leading-normal text-slate-500 dark:text-slate-400">
                      Group POIs automatically if they are geographically inside
                      any of your drawn polygon boundaries. Displays a summary
                      badge in each district.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRAW TOOLS & ELEMENTS LIST */}
          {activeTab === "elements" && (
            <div className="animate-fade-in space-y-6">
              {/* Drawing Mode Initiator */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <h3 className="mb-3 text-xs font-extrabold tracking-wider text-slate-500 uppercase">
                  Create Custom Community Features
                </h3>

                {drawingMode === "idle" ? (
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setDrawingMode("add-poi")
                        setTempCoordinates([])
                      }}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/10 transition-all hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" /> Add custom POI (Marker)
                    </button>
                    <button
                      onClick={() => {
                        setDrawingMode("add-route")
                        setTempCoordinates([])
                      }}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-500/10 transition-all hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" /> Draw custom Route (Polyline)
                    </button>
                    <button
                      onClick={() => {
                        setDrawingMode("add-area")
                        setTempCoordinates([])
                      }}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-500/10 transition-all hover:bg-amber-700"
                    >
                      <Plus className="h-4 w-4" /> Draw custom Area (Polygon)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-xs font-bold text-rose-500">
                      <span className="h-2 w-2 animate-ping rounded-full bg-rose-500"></span>
                      Now drawing:{" "}
                      {drawingMode === "add-poi"
                        ? "POI"
                        : drawingMode === "add-route"
                          ? "Route Polyline"
                          : "Area Polygon"}
                    </div>

                    {(drawingMode === "add-route" ||
                      drawingMode === "add-area") && (
                      <div className="text-[11px] leading-normal text-slate-500 dark:text-slate-400">
                        Click points on the map to construct the vertices.
                        Points placed: <b>{tempCoordinates.length}</b>.
                      </div>
                    )}

                    <div className="flex gap-2">
                      {(drawingMode === "add-route" ||
                        drawingMode === "add-area") &&
                        tempCoordinates.length > 0 && (
                          <button
                            onClick={handleUndoDrawPoint}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            <Undo2 className="h-3.5 w-3.5" /> Undo Pt
                          </button>
                        )}

                      {(drawingMode === "add-route" ||
                        drawingMode === "add-area") && (
                        <button
                          onClick={handleCompleteShapeDrawing}
                          disabled={tempCoordinates.length < 2}
                          className={`flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold text-white shadow-sm transition-all ${
                            tempCoordinates.length >= 2
                              ? "bg-green-600 shadow-green-500/10 hover:bg-green-700"
                              : "cursor-not-allowed bg-slate-300 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" /> Complete
                        </button>
                      )}

                      <button
                        onClick={handleCancelDrawing}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-rose-600 py-1.5 text-xs font-bold text-white shadow-sm shadow-rose-500/10 hover:bg-rose-700"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SAVE POI DIALOG FORM */}
              {showPoiForm && poiFormCoords && (
                <form
                  onSubmit={handleSavePoi}
                  className="animate-fade-in space-y-3 rounded-xl border border-blue-500/30 bg-blue-50/40 p-4 shadow-inner dark:bg-slate-950/20"
                >
                  <div className="mb-2 flex items-center justify-between border-b border-blue-500/20 pb-2">
                    <h4 className="text-xs font-extrabold text-blue-600 uppercase dark:text-blue-400">
                      Save New POI
                    </h4>
                    <span className="font-mono text-[10px] text-slate-500">
                      {poiFormCoords[0].toFixed(4)},{" "}
                      {poiFormCoords[1].toFixed(4)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                      POI Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Garden of Gethsemane"
                      value={poiName}
                      onChange={(e) => setPoiName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-blue-500 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                      Category
                    </label>
                    <select
                      value={poiCategory}
                      onChange={(e) => setPoiCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-blue-500 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <option>Culture & Religion</option>
                      <option>Food & Drink</option>
                      <option>Nature & Parks</option>
                      <option>Services & Facilities</option>
                      <option>General/Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                      Description
                    </label>
                    <textarea
                      placeholder="Enter description, hours, significance..."
                      value={poiDescription}
                      onChange={(e) => setPoiDescription(e.target.value)}
                      className="min-h-[60px] w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-blue-500 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                      Pin Color
                    </label>
                    <div className="flex gap-2">
                      {[
                        "#ef4444",
                        "#3b82f6",
                        "#22c55e",
                        "#eab308",
                        "#a855f7",
                        "#14b8a6",
                      ].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setPoiColor(hex)}
                          className={`h-5 w-5 cursor-pointer rounded-full border border-white transition-transform ${
                            poiColor === hex
                              ? "scale-125 ring-2 ring-blue-500"
                              : ""
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 cursor-pointer rounded-lg bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Save POI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPoiForm(false)
                        setPoiFormCoords(null)
                      }}
                      className="flex-1 cursor-pointer rounded-lg bg-slate-200 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* SAVE SHAPE DIALOG FORM (ROUTE OR AREA) */}
              {showShapeForm && (
                <form
                  onSubmit={handleSaveShape}
                  className="animate-fade-in space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-50/40 p-4 shadow-inner dark:bg-slate-950/20"
                >
                  <div className="mb-2 flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <h4 className="text-xs font-extrabold text-emerald-600 uppercase dark:text-emerald-400">
                      Save{" "}
                      {drawingMode === "add-route" ? "New Route" : "New Area"}
                    </h4>
                    <span className="font-mono text-[10px] text-slate-500">
                      {tempCoordinates.length} Vertices
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`e.g. My Custom ${drawingMode === "add-route" ? "Walk" : "District"}`}
                      value={shapeName}
                      onChange={(e) => setShapeName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-emerald-500 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                      Description
                    </label>
                    <textarea
                      placeholder="Provide routing directions, points of interest along the route or district significance..."
                      value={shapeDescription}
                      onChange={(e) => setShapeDescription(e.target.value)}
                      className="min-h-[60px] w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-emerald-500 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  {drawingMode === "add-route" && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                        Line Thickness ({routeWeight}px)
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="8"
                        value={routeWeight}
                        onChange={(e) =>
                          setRouteWeight(parseInt(e.target.value))
                        }
                        className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                      Fill / Line Color
                    </label>
                    <div className="flex gap-2">
                      {[
                        "#ef4444",
                        "#3b82f6",
                        "#22c55e",
                        "#eab308",
                        "#a855f7",
                        "#ec4899",
                      ].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setShapeColor(hex)}
                          className={`h-5 w-5 cursor-pointer rounded-full border border-white transition-transform ${
                            shapeColor === hex
                              ? "scale-125 ring-2 ring-emerald-500"
                              : ""
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 cursor-pointer rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Save Shape
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowShapeForm(false)
                      }}
                      className="flex-1 cursor-pointer rounded-lg bg-slate-200 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* ACTIVE ELEMENTS DATABASE LISTS */}
              <div className="space-y-4">
                {/* 1. POIs List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      Points of Interest ({pois.length})
                    </h4>
                  </div>
                  {pois.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                      No POIs created yet. Click "Add Custom POI" to start
                      placing markers!
                    </div>
                  ) : (
                    <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
                      {pois.map((poi) => {
                        const details = getCategoryDetails(poi.category)

                        return (
                          <div
                            key={poi.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs transition-all hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className="shrink-0 text-base">
                                {details.symbol}
                              </span>
                              <div className="truncate">
                                <div className="truncate font-semibold">
                                  {poi.name}
                                </div>
                                <div className="truncate text-[9px] text-slate-400">
                                  {poi.category}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeletePoi(poi.id)}
                              className="shrink-0 cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700"
                              title="Delete POI"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Routes List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                    Custom Routes ({routes.length})
                  </h4>
                  {routes.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                      No custom routes drawn yet.
                    </div>
                  ) : (
                    <div className="max-h-[160px] space-y-1.5 overflow-y-auto pr-1">
                      {routes.map((route) => (
                        <div
                          key={route.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800/80"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <div
                              className="h-1.5 w-3.5 shrink-0 rounded-full"
                              style={{ backgroundColor: route.color }}
                            />
                            <div className="truncate">
                              <div className="truncate font-semibold">
                                {route.name}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {route.coordinates.length} points | thickness:{" "}
                                {route.weight}px
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteRoute(route.id)}
                            className="shrink-0 cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Areas List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                    Custom Districts / Areas ({areas.length})
                  </h4>
                  {areas.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                      No custom area regions drawn yet.
                    </div>
                  ) : (
                    <div className="max-h-[160px] space-y-1.5 overflow-y-auto pr-1">
                      {areas.map((area) => (
                        <div
                          key={area.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800/80"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <div
                              className="h-3 w-3 shrink-0 rounded border opacity-80"
                              style={{
                                backgroundColor: area.color,
                                borderColor: area.color,
                              }}
                            />
                            <div className="truncate">
                              <div className="truncate font-semibold">
                                {area.name}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {area.coordinates.length} coordinates
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteArea(area.id)}
                            className="shrink-0 cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AREA CLUSTERS SUMMARY */}
          {activeTab === "clusters" && (
            <div className="animate-fade-in space-y-6 text-xs">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 leading-relaxed text-slate-600 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-slate-400">
                <h4 className="mb-1 flex items-center gap-1 font-bold text-indigo-800 dark:text-indigo-400">
                  💡 How Area Clustering Works
                </h4>
                Any Point of Interest (POI) whose coordinates fall inside a
                drawn district polygon is dynamically grouped into that area's
                cluster. This is perfect for zoning, tourism, and community
                planning!
                <div className="mt-2 text-[10px] font-semibold text-slate-500">
                  ⚠️ Note: Enable "Custom Polygon Area Clustering" in the Map
                  Style tab to visualize these clusters directly on the map
                  viewport!
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold tracking-wider text-slate-400 uppercase">
                  Active Polygon Area Groupings ({areas.length})
                </h3>

                {areas.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-slate-400 dark:border-slate-800">
                    No custom areas drawn yet. Draw an area polygon on the "Draw
                    Tools" tab, place some POIs inside it, and view its
                    statistics here!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {areaClusters.map(
                      ({ area, pois: clusterPois, categories }) => (
                        <div
                          key={area.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                        >
                          <div className="mb-2.5 flex items-start justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                            <div>
                              <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded"
                                  style={{ backgroundColor: area.color }}
                                />
                                {area.name}
                              </h4>
                              <p className="mt-0.5 max-w-[280px] text-[10px] leading-normal text-slate-400">
                                {area.description || "No description provided."}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-extrabold text-primary-foreground shadow-sm">
                              {clusterPois.length} POIs
                            </span>
                          </div>

                          {clusterPois.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              No POIs currently fall inside this area
                              boundaries.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {/* Category Counts Breakdown */}
                              <div>
                                <div className="mb-1.5 text-[10px] font-extrabold text-slate-400 uppercase">
                                  District Category Mix
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(categories).map(
                                    ([cat, count]) => {
                                      const details = getCategoryDetails(cat)
                                      return (
                                        <span
                                          key={cat}
                                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${details.bg} text-white shadow-sm`}
                                        >
                                          <span>{details.symbol}</span>
                                          <span>
                                            {cat} ({count})
                                          </span>
                                        </span>
                                      )
                                    }
                                  )}
                                </div>
                              </div>

                              {/* List of clustered POIs */}
                              <div className="space-y-1">
                                <div className="mb-1 text-[10px] font-extrabold text-slate-400 uppercase">
                                  POIs in District
                                </div>
                                <div className="grid grid-cols-1 gap-1 text-[11px]">
                                  {clusterPois.map((poi) => (
                                    <div
                                      key={poi.id}
                                      className="flex items-center justify-between rounded border border-slate-100 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-900"
                                    >
                                      <span className="max-w-[200px] truncate font-semibold">
                                        {
                                          getCategoryDetails(poi.category)
                                            .symbol
                                        }{" "}
                                        {poi.name}
                                      </span>
                                      <span className="font-mono text-[9px] text-slate-400 uppercase">
                                        {poi.lat.toFixed(4)},{" "}
                                        {poi.lng.toFixed(4)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DEVELOPER CODE GENERATOR */}
          {activeTab === "developer" && (
            <div className="animate-fade-in space-y-5 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 leading-normal text-slate-300">
                <div className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-100">
                  <FileCode2 className="h-4 w-4 text-blue-400" />
                  Code Exporter & DX comparison
                </div>
                The code below automatically renders your visual configuration
                (including base maps, selected overlay trails, and all custom
                POIs, routes, and polygons) in a standalone index.html template!
              </div>

              {/* Boilerplate code download buttons */}
              <div className="space-y-2">
                <h4 className="block font-bold tracking-wider text-slate-500 uppercase">
                  Copy Standalone Boilerplate
                </h4>

                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold">
                      Leaflet Code Block
                    </span>
                    <Button
                      size="sm"
                      className="h-7 cursor-pointer px-2 text-[10px]"
                      onClick={() => {
                        const code = generateLeafletCode(
                          activeBasemap,
                          activeOverlays,
                          center,
                          zoom,
                          pois,
                          routes,
                          areas
                        )
                        navigator.clipboard.writeText(code)
                        alert("Copied Leaflet standalone code to clipboard!")
                      }}
                    >
                      Copy Leaflet Code
                    </Button>
                  </div>
                  <pre className="max-h-[140px] overflow-x-auto overflow-y-auto rounded bg-slate-950 p-2 font-mono text-[9px] whitespace-pre text-emerald-400">
                    {generateLeafletCode(
                      activeBasemap,
                      activeOverlays,
                      center,
                      zoom,
                      pois,
                      routes,
                      areas
                    )}
                  </pre>
                </div>

                <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold">
                      MapLibre GL Code Block
                    </span>
                    <Button
                      size="sm"
                      className="h-7 cursor-pointer px-2 text-[10px]"
                      onClick={() => {
                        const code = generateMapLibreCode(
                          activeBasemap,
                          activeOverlays,
                          center,
                          zoom,
                          pois,
                          routes,
                          areas
                        )
                        navigator.clipboard.writeText(code)
                        alert(
                          "Copied MapLibre GL standalone code to clipboard!"
                        )
                      }}
                    >
                      Copy MapLibre Code
                    </Button>
                  </div>
                  <pre className="max-h-[140px] overflow-x-auto overflow-y-auto rounded bg-slate-950 p-2 font-mono text-[9px] whitespace-pre text-indigo-400">
                    {generateMapLibreCode(
                      activeBasemap,
                      activeOverlays,
                      center,
                      zoom,
                      pois,
                      routes,
                      areas
                    )}
                  </pre>
                </div>
              </div>

              {/* Engineering DX breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="block font-bold tracking-wider text-slate-500 uppercase">
                  Framework Comparison Sheet
                </h4>
                <div className="overflow-hidden rounded-lg border border-slate-200 text-[11px] dark:border-slate-800">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                        <th className="p-2 font-bold">Metric</th>
                        <th className="p-2 font-bold text-blue-600 dark:text-blue-400">
                          Leaflet
                        </th>
                        <th className="p-2 font-bold text-indigo-600 dark:text-indigo-400">
                          MapLibre
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="p-2 font-semibold">Bundle Size</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          ~40KB gzipped
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          ~250KB gzipped
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Rendering Tech</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          HTML DOM, SVG
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          Canvas WebGL/WebGPU
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Vector Tiles</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          Requires Plugins
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          Natively Supported
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">3D Pitch/Rotate</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          No
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          Yes (Smooth pitch, roll)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Ecosystem</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          Huge (Plugins since 2011)
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          Active (Standard mapbox/maptiler style compatibility)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer/Theme Selector */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          <span>
            Active Viewport coordinates:{" "}
            <b>
              {center[0].toFixed(4)}, {center[1].toFixed(4)}
            </b>
          </span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-800">
            Zoom: {zoom}
          </span>
        </div>
      </aside>

      {/* CENTER & RIGHT: THE MAP VIEWPORT */}
      <main className="relative flex h-full flex-1 flex-col overflow-hidden">
        {/* Real-time map switch panel on top of Map */}
        <div className="absolute top-4 right-4 z-[999] flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1.5 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <button
            onClick={() => setLibrary("leaflet")}
            className={`flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              library === "leaflet"
                ? "bg-slate-950 text-slate-100 shadow dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            🍃 Leaflet View
          </button>
          <button
            onClick={() => setLibrary("maplibre")}
            className={`flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              library === "maplibre"
                ? "bg-slate-950 text-slate-100 shadow dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            ⚡ MapLibre GL
          </button>
        </div>

        {/* The Unified Switchable Map Component */}
        <UnifiedMap
          library={library}
          activeBasemap={activeBasemap}
          activeOverlays={activeOverlays}
          pois={pois}
          routes={routes}
          areas={areas}
          center={center}
          zoom={zoom}
          drawingMode={drawingMode}
          tempCoordinates={tempCoordinates}
          clusterMode={clusterMode}
          onMapClick={handleMapClick}
          onMoveEnd={(c, z) => {
            setCenter(c)
            setZoom(z)
          }}
        />
      </main>
    </div>
  )
}

export default App
