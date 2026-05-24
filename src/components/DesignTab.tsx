import { useState } from "react"
import { Trash2, Plus, X, SlidersHorizontal, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OVERLAYS, type BaseMapProvider } from "@/lib/providers"
import type { BasemapFilters } from "@/lib/types"

interface DesignTabProps {
  library: "leaflet" | "maplibre"
  setLibrary: (lib: "leaflet" | "maplibre") => void
  activeBasemap: string
  setActiveBasemap: (b: string) => void
  activeOverlays: string[]
  setActiveOverlays: React.Dispatch<React.SetStateAction<string[]>>
  clusterMode: "none" | "maplibre-native" | "area-polygons"
  setClusterMode: (m: "none" | "maplibre-native" | "area-polygons") => void
  customBasemaps: BaseMapProvider[]
  setCustomBasemaps: React.Dispatch<React.SetStateAction<BaseMapProvider[]>>
  basemapFilters: BasemapFilters
  setBasemapFilters: React.Dispatch<React.SetStateAction<BasemapFilters>>
  handleDeleteCustomBasemap: (id: string, e: React.MouseEvent) => void
  allBasemaps: BaseMapProvider[]
}

export function DesignTab({
  library,
  setLibrary,
  activeBasemap,
  setActiveBasemap,
  activeOverlays,
  setActiveOverlays,
  clusterMode,
  setClusterMode,
  customBasemaps,
  setCustomBasemaps,
  basemapFilters,
  setBasemapFilters,
  handleDeleteCustomBasemap,
  allBasemaps,
}: DesignTabProps) {
  // Form States for Custom Basemap creation inside DesignTab
  const [showCustomBasemapForm, setShowCustomBasemapForm] = useState(false)
  const [newBasemapName, setNewBasemapName] = useState("")
  const [newBasemapUrl, setNewBasemapUrl] = useState("")
  const [newBasemapAttribution, setNewBasemapAttribution] = useState("")
  const [newBasemapDesc, setNewBasemapDesc] = useState("")
  const [newBasemapIsVector, setNewBasemapIsVector] = useState(false)

  return (
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
  )
}
