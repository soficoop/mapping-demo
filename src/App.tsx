import { useState, useEffect, useRef } from "react"
import {
  Compass,
  RotateCcw,
  Download,
  Upload,
  Layers2,
  FolderTree,
  FileCode2,
} from "lucide-react"
import { BASEMAPS, type BaseMapProvider } from "@/lib/providers"
import type { POI, Route, Area, DrawingMode, BasemapFilters } from "@/lib/types"
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  INITIAL_POIS,
  INITIAL_ROUTES,
  INITIAL_AREAS,
} from "@/lib/mockData"
import { stateToGeoJSON, geoJSONToState } from "@/lib/geoUtils"
import { UnifiedMap } from "@/components/UnifiedMap"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { SplashScreen } from "@/components/SplashScreen"
import { DeveloperTab } from "@/components/DeveloperTab"
import { ClustersTab } from "@/components/ClustersTab"
import { DesignTab } from "@/components/DesignTab"
import { ElementsTab } from "@/components/ElementsTab"

export default function App() {
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
              <DesignTab
                library={library}
                setLibrary={setLibrary}
                activeBasemap={activeBasemap}
                setActiveBasemap={setActiveBasemap}
                activeOverlays={activeOverlays}
                setActiveOverlays={setActiveOverlays}
                clusterMode={clusterMode}
                setClusterMode={setClusterMode}
                customBasemaps={customBasemaps}
                setCustomBasemaps={setCustomBasemaps}
                basemapFilters={basemapFilters}
                setBasemapFilters={setBasemapFilters}
                handleDeleteCustomBasemap={handleDeleteCustomBasemap}
                allBasemaps={allBasemaps}
              />
            )}

            {/* TAB 2: DRAW TOOLS & ELEMENTS LIST */}
            {activeTab === "elements" && (
              <ElementsTab
                drawingMode={drawingMode}
                setDrawingMode={setDrawingMode}
                tempCoordinates={tempCoordinates}
                setTempCoordinates={setTempCoordinates}
                showPoiForm={showPoiForm}
                setShowPoiForm={setShowPoiForm}
                poiFormCoords={poiFormCoords}
                setPoiFormCoords={setPoiFormCoords}
                poiName={poiName}
                setPoiName={setPoiName}
                poiCategory={poiCategory}
                setPoiCategory={setPoiCategory}
                poiDescription={poiDescription}
                setPoiDescription={setPoiDescription}
                poiColor={poiColor}
                setPoiColor={setPoiColor}
                showShapeForm={showShapeForm}
                setShowShapeForm={setShowShapeForm}
                shapeName={shapeName}
                setShapeName={setShapeName}
                shapeDescription={shapeDescription}
                setShapeDescription={setShapeDescription}
                shapeColor={shapeColor}
                setShapeColor={setShapeColor}
                routeWeight={routeWeight}
                setRouteWeight={setRouteWeight}
                pois={pois}
                routes={routes}
                areas={areas}
                setAreas={setAreas}
                handleUndoDrawPoint={handleUndoDrawPoint}
                handleCompleteShapeDrawing={handleCompleteShapeDrawing}
                handleCancelDrawing={handleCancelDrawing}
                handleSavePoi={handleSavePoi}
                handleSaveShape={handleSaveShape}
                handleDeletePoi={handleDeletePoi}
                handleDeleteRoute={handleDeleteRoute}
                handleDeleteArea={handleDeleteArea}
                setCenter={setCenter}
                setZoom={setZoom}
              />
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
                  : "text-slate-500 hover:text-slate-950 dark:hover:text-slate-200"
              }`}
            >
              🍃 Leaflet View
            </button>
            <button
              onClick={() => setLibrary("maplibre")}
              className={`flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                library === "maplibre"
                  ? "bg-slate-950 text-slate-100 shadow dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:text-slate-950 dark:hover:text-slate-200"
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
