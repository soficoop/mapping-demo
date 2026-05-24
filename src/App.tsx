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
  SlidersHorizontal,
} from "lucide-react"
import { BASEMAPS, OVERLAYS, type BaseMapProvider } from "@/lib/providers"
import type { POI, Route, Area, DrawingMode, BasemapFilters } from "@/lib/types"
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
import { UnifiedMap } from "@/components/UnifiedMap"
import { getCategoryDetails } from "@/lib/utils"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { SplashScreen } from "@/components/SplashScreen"
import { DeveloperTab } from "@/components/DeveloperTab"
import { ClustersTab } from "@/components/ClustersTab"

export function App() {
  // --- Loading / Splash Screen State ---
  const [showSplash, setShowSplash] = useState(true)

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

  // --- Custom Basemap & Filtering State ---
  const [customBasemaps, setCustomBasemaps] = useState<BaseMapProvider[]>(
    () => {
      const saved = localStorage.getItem("mapping_demo_custom_basemaps")
      return saved ? JSON.parse(saved) : []
    }
  )

  const [basemapFilters, setBasemapFilters] = useState<BasemapFilters>(() => {
    const saved = localStorage.getItem("mapping_demo_basemap_filters")
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.opacity === undefined) {
        parsed.opacity = 100
      }
      return parsed
    }
    return {
      grayscale: 0,
      invert: 0,
      hueRotate: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      opacity: 100,
    }
  })

  // Form States for Custom Basemap creation
  const [showCustomBasemapForm, setShowCustomBasemapForm] = useState(false)
  const [newBasemapName, setNewBasemapName] = useState("")
  const [newBasemapUrl, setNewBasemapUrl] = useState("")
  const [newBasemapAttribution, setNewBasemapAttribution] = useState("")
  const [newBasemapDesc, setNewBasemapDesc] = useState("")
  const [newBasemapIsVector, setNewBasemapIsVector] = useState(false)

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

  const allBasemaps = [...BASEMAPS, ...customBasemaps]

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

  useEffect(() => {
    localStorage.setItem(
      "mapping_demo_custom_basemaps",
      JSON.stringify(customBasemaps)
    )
  }, [customBasemaps])

  useEffect(() => {
    localStorage.setItem(
      "mapping_demo_basemap_filters",
      JSON.stringify(basemapFilters)
    )
  }, [basemapFilters])

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
        borderColor: shapeColor,
        fillColor: shapeColor,
        fillOpacity: 0.25,
        strokeWeight: 2,
        borderStyle: "solid",
        blendMode: "normal",
        glowEffect: false,
        filters: {
          grayscale: 0,
          invert: 0,
          hueRotate: 0,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sepia: 0,
          opacity: 100,
          enabled: false,
        },
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

  const handleDeleteCustomBasemap = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCustomBasemaps((prev) => prev.filter((b) => b.id !== id))
    if (activeBasemap === id) {
      setActiveBasemap("osm-standard")
    }
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
      setCustomBasemaps([])
      setBasemapFilters({
        grayscale: 0,
        invert: 0,
        hueRotate: 0,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        sepia: 0,
        opacity: 100,
      })
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
      } catch {
        alert(
          "Error parsing GeoJSON. Please make sure it is a valid GeoJSON file."
        )
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = "" // clear
  }

  // --- Sync database with LocalStorage ---
  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        {/* LEFT SIDEBAR (Controls & Data Management) */}
        <aside className="z-10 flex h-full w-[440px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {/* Playground Header */}
          <div className="border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Logo iconSize={46} usePng={true} />
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
                        ⚡ <b>MapLibre GL</b> utilizes GPU WebGL for vector
                        tiles. Supports smooth rotating, 3D pitching, and
                        rendering massive datasets.
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
                      "Custom Basemaps",
                    ] as const
                  ).map((cat) => {
                    const filtered = allBasemaps.filter(
                      (b) => b.category === cat
                    )
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
                            const isCustom = customBasemaps.some(
                              (cb) => cb.id === b.id
                            )

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
                                  <div className="flex items-center gap-1.5">
                                    {b.isVector && (
                                      <span className="rounded bg-indigo-100/50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 uppercase dark:bg-indigo-900/30 dark:text-indigo-400">
                                        Vector Style
                                      </span>
                                    )}
                                    {isCustom && (
                                      <button
                                        onClick={(e) =>
                                          handleDeleteCustomBasemap(b.id, e)
                                        }
                                        className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-rose-500 dark:hover:bg-slate-800"
                                        title="Delete custom basemap"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
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

                  {/* Custom Basemap Add Section */}
                  <div className="rounded-lg border border-dashed border-slate-300 p-3.5 dark:border-slate-700">
                    {!showCustomBasemapForm ? (
                      <button
                        onClick={() => setShowCustomBasemapForm(true)}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-slate-50 py-2.5 text-xs font-bold text-indigo-600 hover:bg-slate-100 dark:bg-slate-900/40 dark:text-indigo-400 dark:hover:bg-slate-800"
                      >
                        <Plus className="h-4 w-4" />
                        Add Custom Basemap Source
                      </button>
                    ) : (
                      <div className="animate-fade-in space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Create Custom Basemap
                          </span>
                          <button
                            onClick={() => setShowCustomBasemapForm(false)}
                            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-2 text-[11px]">
                          <div>
                            <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-400">
                              Basemap Name
                            </label>
                            <input
                              type="text"
                              value={newBasemapName}
                              onChange={(e) =>
                                setNewBasemapName(e.target.value)
                              }
                              placeholder="e.g. My Custom Tiles"
                              className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                            />
                          </div>

                          <div className="flex gap-4 py-1">
                            <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
                              <input
                                type="radio"
                                checked={!newBasemapIsVector}
                                onChange={() => setNewBasemapIsVector(false)}
                                className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500"
                              />
                              Raster Tiles
                            </label>
                            <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
                              <input
                                type="radio"
                                checked={newBasemapIsVector}
                                onChange={() => setNewBasemapIsVector(true)}
                                className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500"
                              />
                              Vector Style URL (MapLibre)
                            </label>
                          </div>

                          <div>
                            <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-400">
                              {newBasemapIsVector
                                ? "Vector Style JSON URL"
                                : "Tile URL Template"}
                            </label>
                            <input
                              type="text"
                              value={newBasemapUrl}
                              onChange={(e) => setNewBasemapUrl(e.target.value)}
                              placeholder={
                                newBasemapIsVector
                                  ? "https://tiles.openfreemap.org/styles/liberty"
                                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              }
                              className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-400">
                              Attribution / Credits
                            </label>
                            <input
                              type="text"
                              value={newBasemapAttribution}
                              onChange={(e) =>
                                setNewBasemapAttribution(e.target.value)
                              }
                              placeholder="&copy; OpenStreetMap contributors"
                              className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block font-semibold text-slate-600 dark:text-slate-400">
                              Description
                            </label>
                            <textarea
                              value={newBasemapDesc}
                              onChange={(e) =>
                                setNewBasemapDesc(e.target.value)
                              }
                              placeholder="Brief description of this map source..."
                              rows={2}
                              className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowCustomBasemapForm(false)
                              setNewBasemapName("")
                              setNewBasemapUrl("")
                              setNewBasemapAttribution("")
                              setNewBasemapDesc("")
                            }}
                            className="flex-1 cursor-pointer text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (
                                !newBasemapName.trim() ||
                                !newBasemapUrl.trim()
                              ) {
                                alert("Please fill in Name and URL!")
                                return
                              }
                              const newId = `custom-basemap-${Date.now()}`
                              const newB = {
                                id: newId,
                                name: newBasemapName,
                                category: "Custom Basemaps" as const,
                                attribution:
                                  newBasemapAttribution ||
                                  "Custom basemap provider",
                                description:
                                  newBasemapDesc || "Custom user map source",
                                ...(newBasemapIsVector
                                  ? { styleUrl: newBasemapUrl, isVector: true }
                                  : { url: newBasemapUrl }),
                              }
                              setCustomBasemaps((prev) => [...prev, newB])
                              setActiveBasemap(newId)
                              setShowCustomBasemapForm(false)
                              setNewBasemapName("")
                              setNewBasemapUrl("")
                              setNewBasemapAttribution("")
                              setNewBasemapDesc("")
                            }}
                            className="flex-1 cursor-pointer bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                          >
                            Save Basemap
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Basemap Color Adjustments */}
                  <div className="space-y-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        <SlidersHorizontal className="h-4 w-4 shrink-0 text-indigo-500" />
                        2b. Map Color Adjustments
                      </label>
                      {(basemapFilters.grayscale > 0 ||
                        basemapFilters.invert > 0 ||
                        basemapFilters.hueRotate > 0 ||
                        basemapFilters.brightness !== 100 ||
                        basemapFilters.contrast !== 100 ||
                        basemapFilters.saturation !== 100 ||
                        basemapFilters.sepia > 0 ||
                        (basemapFilters.opacity !== undefined &&
                          basemapFilters.opacity !== 100)) && (
                        <button
                          onClick={() =>
                            setBasemapFilters({
                              grayscale: 0,
                              invert: 0,
                              hueRotate: 0,
                              brightness: 100,
                              contrast: 100,
                              saturation: 100,
                              sepia: 0,
                              opacity: 100,
                            })
                          }
                          className="flex cursor-pointer items-center gap-0.5 text-[10px] font-bold text-rose-500 hover:underline"
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] leading-normal text-slate-500 dark:text-slate-400">
                      GPU-accelerated visual filters applied to the map
                      background tiles. Create dark-themes, sepia tones, or
                      entirely new map aesthetics in real-time.
                    </p>

                    <div className="space-y-3 text-[11px]">
                      {/* Grayscale */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Grayscale
                          </span>
                          <span className="font-mono text-slate-500">
                            {basemapFilters.grayscale}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={basemapFilters.grayscale}
                          onChange={(e) =>
                            setBasemapFilters((prev) => ({
                              ...prev,
                              grayscale: parseInt(e.target.value),
                            }))
                          }
                          className="h-1.5 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-800"
                        />
                      </div>

                      {/* Invert */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Invert Colors (Darken Light Maps)
                          </span>
                          <span className="font-mono text-slate-500">
                            {basemapFilters.invert}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={basemapFilters.invert}
                          onChange={(e) =>
                            setBasemapFilters((prev) => ({
                              ...prev,
                              invert: parseInt(e.target.value),
                            }))
                          }
                          className="h-1.5 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-800"
                        />
                      </div>

                      {/* Hue Rotate */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Hue Rotation (Color Shift)
                          </span>
                          <span className="font-mono text-slate-500">
                            {basemapFilters.hueRotate}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={basemapFilters.hueRotate}
                          onChange={(e) =>
                            setBasemapFilters((prev) => ({
                              ...prev,
                              hueRotate: parseInt(e.target.value),
                            }))
                          }
                          className="h-1.5 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-800"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Saturation (Vibrancy)
                          </span>
                          <span className="font-mono text-slate-500">
                            {basemapFilters.saturation}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={basemapFilters.saturation}
                          onChange={(e) =>
                            setBasemapFilters((prev) => ({
                              ...prev,
                              saturation: parseInt(e.target.value),
                            }))
                          }
                          className="h-1.5 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-800"
                        />
                      </div>

                      {/* Brightness */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Brightness
                          </span>
                          <span className="font-mono text-slate-500">
                            {basemapFilters.brightness}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={basemapFilters.brightness}
                          onChange={(e) =>
                            setBasemapFilters((prev) => ({
                              ...prev,
                              brightness: parseInt(e.target.value),
                            }))
                          }
                          className="h-1.5 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-800"
                        />
                      </div>

                      {/* Contrast */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Contrast
                          </span>
                          <span className="font-mono text-slate-500">
                            {basemapFilters.contrast}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={basemapFilters.contrast}
                          onChange={(e) =>
                            setBasemapFilters((prev) => ({
                              ...prev,
                              contrast: parseInt(e.target.value),
                            }))
                          }
                          className="h-1.5 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-800"
                        />
                      </div>

                      {/* Sepia */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Sepia Tone
                          </span>
                          <span className="font-mono text-slate-500">
                            {basemapFilters.sepia}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={basemapFilters.sepia}
                          onChange={(e) =>
                            setBasemapFilters((prev) => ({
                              ...prev,
                              sepia: parseInt(e.target.value),
                            }))
                          }
                          className="h-1.5 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-800"
                        />
                      </div>

                      {/* Opacity */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Opacity / Fade
                          </span>
                          <span className="font-mono text-slate-500">
                            {basemapFilters.opacity ?? 100}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={basemapFilters.opacity ?? 100}
                          onChange={(e) =>
                            setBasemapFilters((prev) => ({
                              ...prev,
                              opacity: parseInt(e.target.value),
                            }))
                          }
                          className="h-1.5 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>
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
                        High-performance WebGL clustering with numbered counts
                        and dynamic boundaries.
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
                        Group POIs automatically if they are geographically
                        inside any of your drawn polygon boundaries. Displays a
                        summary badge in each district.
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
                        <Plus className="h-4 w-4" /> Draw custom Route
                        (Polyline)
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
                      <div className="max-h-[350px] space-y-2.5 overflow-y-auto pr-1">
                        {areas.map((area) => (
                          <div
                            key={area.id}
                            className="flex flex-col space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-800/80"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate pr-2">
                                <div
                                  className="h-3.5 w-3.5 shrink-0 rounded border opacity-80"
                                  style={{
                                    backgroundColor: area.color,
                                    borderColor: area.color,
                                  }}
                                />
                                <div className="truncate">
                                  <div className="truncate font-semibold text-slate-800 dark:text-slate-100">
                                    {area.name}
                                  </div>
                                  <div className="text-[9px] text-slate-400">
                                    {area.coordinates.length} coordinates
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    const pts = area.coordinates
                                    if (pts.length > 0) {
                                      let latSum = 0,
                                        lngSum = 0
                                      pts.forEach(([lat, lng]) => {
                                        latSum += lat
                                        lngSum += lng
                                      })
                                      const centroidLat = latSum / pts.length
                                      const centroidLng = lngSum / pts.length
                                      setCenter([centroidLat, centroidLng])
                                      setZoom(15)
                                    }
                                  }}
                                  className="cursor-pointer rounded bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900"
                                  title="Recenter map on this area"
                                >
                                  Focus 🎯
                                </button>
                                <button
                                  onClick={() => handleDeleteArea(area.id)}
                                  className="shrink-0 cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Unique Styling Controls */}
                            <div className="animate-fade-in space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold tracking-wider text-indigo-500 uppercase">
                                  Area Styling Controls
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                {/* Color inputs */}
                                <div>
                                  <label className="mb-0.5 block text-[9px] font-semibold text-slate-400 uppercase">
                                    Border
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={area.borderColor || area.color}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setAreas((prev) =>
                                          prev.map((a) =>
                                            a.id === area.id
                                              ? { ...a, borderColor: val }
                                              : a
                                          )
                                        )
                                      }}
                                      className="h-6 w-9 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
                                    />
                                    <span className="truncate font-mono text-[9px]">
                                      {area.borderColor || area.color}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-0.5 block text-[9px] font-semibold text-slate-400 uppercase">
                                    Fill
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={area.fillColor || area.color}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setAreas((prev) =>
                                          prev.map((a) =>
                                            a.id === area.id
                                              ? { ...a, fillColor: val }
                                              : a
                                          )
                                        )
                                      }}
                                      className="h-6 w-9 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
                                    />
                                    <span className="truncate font-mono text-[9px]">
                                      {area.fillColor || area.color}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                {/* Stroke Weight */}
                                <div>
                                  <div className="mb-0.5 flex justify-between text-[9px] font-semibold text-slate-400 uppercase">
                                    <span>
                                      Border ({area.strokeWeight ?? 2}px)
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="8"
                                    value={area.strokeWeight ?? 2}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value)
                                      setAreas((prev) =>
                                        prev.map((a) =>
                                          a.id === area.id
                                            ? { ...a, strokeWeight: val }
                                            : a
                                        )
                                      )
                                    }}
                                    className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                  />
                                </div>

                                {/* Fill Opacity */}
                                <div>
                                  <div className="mb-0.5 flex justify-between text-[9px] font-semibold text-slate-400 uppercase">
                                    <span>
                                      Opacity (
                                      {Math.round(
                                        (area.fillOpacity ?? 0.25) * 100
                                      )}
                                      %)
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={Math.round(
                                      (area.fillOpacity ?? 0.25) * 100
                                    )}
                                    onChange={(e) => {
                                      const val = parseFloat(
                                        (
                                          parseInt(e.target.value) / 100
                                        ).toFixed(2)
                                      )
                                      setAreas((prev) =>
                                        prev.map((a) =>
                                          a.id === area.id
                                            ? { ...a, fillOpacity: val }
                                            : a
                                        )
                                      )
                                    }}
                                    className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                {/* Border Style */}
                                <div>
                                  <label className="mb-0.5 block text-[9px] font-semibold text-slate-400 uppercase">
                                    Border Style
                                  </label>
                                  <select
                                    value={area.borderStyle || "solid"}
                                    onChange={(e) => {
                                      const val = e.target.value as
                                        | "solid"
                                        | "dashed"
                                        | "dotted"
                                        | "none"
                                      setAreas((prev) =>
                                        prev.map((a) =>
                                          a.id === area.id
                                            ? { ...a, borderStyle: val }
                                            : a
                                        )
                                      )
                                    }}
                                    className="w-full cursor-pointer rounded border border-slate-200 bg-slate-50 p-1 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                  >
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                    <option value="none">None</option>
                                  </select>
                                </div>

                                {/* Blend Mode */}
                                <div>
                                  <label className="mb-0.5 block text-[9px] font-semibold text-slate-400 uppercase">
                                    Blend Effect
                                  </label>
                                  <select
                                    value={area.blendMode || "normal"}
                                    onChange={(e) => {
                                      const val = e.target.value as
                                        | "normal"
                                        | "color"
                                        | "multiply"
                                        | "overlay"
                                      setAreas((prev) =>
                                        prev.map((a) =>
                                          a.id === area.id
                                            ? { ...a, blendMode: val }
                                            : a
                                        )
                                      )
                                    }}
                                    className="w-full cursor-pointer rounded border border-slate-200 bg-slate-50 p-1 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                  >
                                    <option value="normal">Normal Blend</option>
                                    <option value="color">Color Tint 🎨</option>
                                    <option value="multiply">
                                      Multiply (Darken)
                                    </option>
                                    <option value="overlay">
                                      Overlay (High Contrast)
                                    </option>
                                  </select>
                                </div>
                              </div>

                              {/* Glow Effect Toggle */}
                              <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                <input
                                  type="checkbox"
                                  checked={area.glowEffect || false}
                                  onChange={(e) => {
                                    const val = e.target.checked
                                    setAreas((prev) =>
                                      prev.map((a) =>
                                        a.id === area.id
                                          ? { ...a, glowEffect: val }
                                          : a
                                      )
                                    )
                                  }}
                                  className="h-3.5 w-3.5 cursor-pointer rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                Enable Outer Neon Glow 🌟
                              </label>

                              {/* Filter Overrides Container */}
                              <div className="space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                                <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                  <input
                                    type="checkbox"
                                    checked={area.filters?.enabled || false}
                                    onChange={(e) => {
                                      const val = e.target.checked
                                      setAreas((prev) =>
                                        prev.map((a) =>
                                          a.id === area.id
                                            ? {
                                                ...a,
                                                filters: {
                                                  grayscale:
                                                    a.filters?.grayscale ?? 0,
                                                  invert:
                                                    a.filters?.invert ?? 0,
                                                  hueRotate:
                                                    a.filters?.hueRotate ?? 0,
                                                  brightness:
                                                    a.filters?.brightness ??
                                                    100,
                                                  contrast:
                                                    a.filters?.contrast ?? 100,
                                                  saturation:
                                                    a.filters?.saturation ??
                                                    100,
                                                  sepia: a.filters?.sepia ?? 0,
                                                  opacity:
                                                    a.filters?.opacity ?? 100,
                                                  enabled: val,
                                                },
                                              }
                                            : a
                                        )
                                      )
                                    }}
                                    className="h-3.5 w-3.5 cursor-pointer rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  Override Global Filters 🎛️
                                </label>

                                {area.filters?.enabled && (
                                  <div className="animate-fade-in space-y-2 rounded border border-indigo-100 bg-indigo-50/20 p-2 text-[10px] dark:border-slate-800 dark:bg-slate-900/40">
                                    <div className="mb-1 text-[9px] font-semibold text-indigo-600 italic dark:text-indigo-400">
                                      💡 Active only inside this polygon
                                      (Leaflet JS)
                                    </div>

                                    {/* Grayscale */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                        <span>Grayscale</span>
                                        <span>{area.filters.grayscale}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={area.filters.grayscale}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value)
                                          setAreas((prev) =>
                                            prev.map((a) =>
                                              a.id === area.id && a.filters
                                                ? {
                                                    ...a,
                                                    filters: {
                                                      ...a.filters,
                                                      grayscale: val,
                                                    },
                                                  }
                                                : a
                                            )
                                          )
                                        }}
                                        className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                      />
                                    </div>

                                    {/* Invert */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                        <span>Invert Colors</span>
                                        <span>{area.filters.invert}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={area.filters.invert}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value)
                                          setAreas((prev) =>
                                            prev.map((a) =>
                                              a.id === area.id && a.filters
                                                ? {
                                                    ...a,
                                                    filters: {
                                                      ...a.filters,
                                                      invert: val,
                                                    },
                                                  }
                                                : a
                                            )
                                          )
                                        }}
                                        className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                      />
                                    </div>

                                    {/* Hue Rotate */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                        <span>Hue Rotation</span>
                                        <span>{area.filters.hueRotate}°</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={area.filters.hueRotate}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value)
                                          setAreas((prev) =>
                                            prev.map((a) =>
                                              a.id === area.id && a.filters
                                                ? {
                                                    ...a,
                                                    filters: {
                                                      ...a.filters,
                                                      hueRotate: val,
                                                    },
                                                  }
                                                : a
                                            )
                                          )
                                        }}
                                        className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                      />
                                    </div>

                                    {/* Saturation */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                        <span>Saturation</span>
                                        <span>{area.filters.saturation}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        value={area.filters.saturation}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value)
                                          setAreas((prev) =>
                                            prev.map((a) =>
                                              a.id === area.id && a.filters
                                                ? {
                                                    ...a,
                                                    filters: {
                                                      ...a.filters,
                                                      saturation: val,
                                                    },
                                                  }
                                                : a
                                            )
                                          )
                                        }}
                                        className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                      />
                                    </div>

                                    {/* Brightness */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                        <span>Brightness</span>
                                        <span>{area.filters.brightness}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="50"
                                        max="150"
                                        value={area.filters.brightness}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value)
                                          setAreas((prev) =>
                                            prev.map((a) =>
                                              a.id === area.id && a.filters
                                                ? {
                                                    ...a,
                                                    filters: {
                                                      ...a.filters,
                                                      brightness: val,
                                                    },
                                                  }
                                                : a
                                            )
                                          )
                                        }}
                                        className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                      />
                                    </div>

                                    {/* Contrast */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                        <span>Contrast</span>
                                        <span>{area.filters.contrast}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="50"
                                        max="150"
                                        value={area.filters.contrast}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value)
                                          setAreas((prev) =>
                                            prev.map((a) =>
                                              a.id === area.id && a.filters
                                                ? {
                                                    ...a,
                                                    filters: {
                                                      ...a.filters,
                                                      contrast: val,
                                                    },
                                                  }
                                                : a
                                            )
                                          )
                                        }}
                                        className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                      />
                                    </div>

                                    {/* Sepia */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                        <span>Sepia Tone</span>
                                        <span>{area.filters.sepia}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={area.filters.sepia}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value)
                                          setAreas((prev) =>
                                            prev.map((a) =>
                                              a.id === area.id && a.filters
                                                ? {
                                                    ...a,
                                                    filters: {
                                                      ...a.filters,
                                                      sepia: val,
                                                    },
                                                  }
                                                : a
                                            )
                                          )
                                        }}
                                        className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                      />
                                    </div>

                                    {/* Opacity */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                        <span>Opacity / Fade</span>
                                        <span>
                                          {area.filters.opacity ?? 100}%
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={area.filters.opacity ?? 100}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value)
                                          setAreas((prev) =>
                                            prev.map((a) =>
                                              a.id === area.id && a.filters
                                                ? {
                                                    ...a,
                                                    filters: {
                                                      ...a.filters,
                                                      opacity: val,
                                                    },
                                                  }
                                                : a
                                            )
                                          )
                                        }}
                                        className="h-1 w-full cursor-pointer rounded bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
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
              <ClustersTab pois={pois} areas={areas} />
            )}

            {/* TAB 4: DEVELOPER CODE GENERATOR */}
            {activeTab === "developer" && (
              <DeveloperTab
                activeBasemap={activeBasemap}
                activeOverlays={activeOverlays}
                center={center}
                zoom={zoom}
                pois={pois}
                routes={routes}
                areas={areas}
              />
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
            customBasemaps={customBasemaps}
            basemapFilters={basemapFilters}
          />
        </main>
      </div>
    </>
  )
}

export default App
