import { Plus, Undo2, Check, X, Trash2 } from "lucide-react"
import { getCategoryDetails } from "@/lib/utils"
import type { POI, Route, Area, DrawingMode } from "@/lib/types"

interface ElementsTabProps {
  drawingMode: DrawingMode
  setDrawingMode: (m: DrawingMode) => void
  tempCoordinates: [number, number][]
  setTempCoordinates: React.Dispatch<React.SetStateAction<[number, number][]>>
  showPoiForm: boolean
  setShowPoiForm: (b: boolean) => void
  poiFormCoords: [number, number] | null
  setPoiFormCoords: (c: [number, number] | null) => void
  poiName: string
  setPoiName: (s: string) => void
  poiCategory: string
  setPoiCategory: (s: string) => void
  poiDescription: string
  setPoiDescription: (s: string) => void
  poiColor: string
  setPoiColor: (s: string) => void
  showShapeForm: boolean
  setShowShapeForm: (b: boolean) => void
  shapeName: string
  setShapeName: (s: string) => void
  shapeDescription: string
  setShapeDescription: (s: string) => void
  shapeColor: string
  setShapeColor: (s: string) => void
  routeWeight: number
  setRouteWeight: (w: number) => void
  pois: POI[]
  routes: Route[]
  areas: Area[]
  setAreas: React.Dispatch<React.SetStateAction<Area[]>>
  handleUndoDrawPoint: () => void
  handleCompleteShapeDrawing: () => void
  handleCancelDrawing: () => void
  handleSavePoi: (e: React.FormEvent) => void
  handleSaveShape: (e: React.FormEvent) => void
  handleDeletePoi: (id: string) => void
  handleDeleteRoute: (id: string) => void
  handleDeleteArea: (id: string) => void
  setCenter: (c: [number, number]) => void
  setZoom: (z: number) => void
}

export function ElementsTab({
  drawingMode,
  setDrawingMode,
  tempCoordinates,
  setTempCoordinates,
  showPoiForm,
  setShowPoiForm,
  poiFormCoords,
  setPoiFormCoords,
  poiName,
  setPoiName,
  poiCategory,
  setPoiCategory,
  poiDescription,
  setPoiDescription,
  poiColor,
  setPoiColor,
  showShapeForm,
  setShowShapeForm,
  shapeName,
  setShapeName,
  shapeDescription,
  setShapeDescription,
  shapeColor,
  setShapeColor,
  routeWeight,
  setRouteWeight,
  pois,
  routes,
  areas,
  setAreas,
  handleUndoDrawPoint,
  handleCompleteShapeDrawing,
  handleCancelDrawing,
  handleSavePoi,
  handleSaveShape,
  handleDeletePoi,
  handleDeleteRoute,
  handleDeleteArea,
  setCenter,
  setZoom,
}: ElementsTabProps) {
  return (
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

            {(drawingMode === "add-route" || drawingMode === "add-area") && (
              <div className="text-[11px] leading-normal text-slate-500 dark:text-slate-400">
                Click points on the map to construct the vertices. Points
                placed: <b>{tempCoordinates.length}</b>.
              </div>
            )}

            <div className="flex gap-2">
              {(drawingMode === "add-route" || drawingMode === "add-area") &&
                tempCoordinates.length > 0 && (
                  <button
                    onClick={handleUndoDrawPoint}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Undo Pt
                  </button>
                )}

              {(drawingMode === "add-route" || drawingMode === "add-area") && (
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
              {poiFormCoords[0].toFixed(4)}, {poiFormCoords[1].toFixed(4)}
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
                    poiColor === hex ? "scale-125 ring-2 ring-blue-500" : ""
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
              Save {drawingMode === "add-route" ? "New Route" : "New Area"}
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
                onChange={(e) => setRouteWeight(parseInt(e.target.value))}
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
              No POIs created yet. Click "Add Custom POI" to start placing
              markers!
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
                        <div className="truncate font-sans font-semibold text-slate-800 dark:text-slate-100">
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
                      <div className="truncate font-sans font-semibold text-slate-800 dark:text-slate-100">
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
                        <div className="truncate font-sans font-semibold text-slate-800 dark:text-slate-100">
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
                          <span>Border ({area.strokeWeight ?? 2}px)</span>
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
                            {Math.round((area.fillOpacity ?? 0.25) * 100)}
                            %)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round((area.fillOpacity ?? 0.25) * 100)}
                          onChange={(e) => {
                            const val = parseFloat(
                              (parseInt(e.target.value) / 100).toFixed(2)
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
                                a.id === area.id ? { ...a, blendMode: val } : a
                              )
                            )
                          }}
                          className="w-full cursor-pointer rounded border border-slate-200 bg-slate-50 p-1 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <option value="normal">Normal Blend</option>
                          <option value="color">Color Tint 🎨</option>
                          <option value="multiply">Multiply (Darken)</option>
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
                              a.id === area.id ? { ...a, glowEffect: val } : a
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
                                        grayscale: a.filters?.grayscale ?? 0,
                                        invert: a.filters?.invert ?? 0,
                                        hueRotate: a.filters?.hueRotate ?? 0,
                                        brightness:
                                          a.filters?.brightness ?? 100,
                                        contrast: a.filters?.contrast ?? 100,
                                        saturation:
                                          a.filters?.saturation ?? 100,
                                        sepia: a.filters?.sepia ?? 0,
                                        opacity: a.filters?.opacity ?? 100,
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
                            💡 Active only inside this polygon (Leaflet JS)
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
                              <span>{area.filters.opacity ?? 100}%</span>
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
  )
}
