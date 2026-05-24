import { FileCode2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateLeafletCode, generateMapLibreCode } from "@/lib/geoUtils"
import type { POI, Route, Area } from "@/lib/types"

interface DeveloperTabProps {
  activeBasemap: string
  activeOverlays: string[]
  center: [number, number]
  zoom: number
  pois: POI[]
  routes: Route[]
  areas: Area[]
}

export function DeveloperTab({
  activeBasemap,
  activeOverlays,
  center,
  zoom,
  pois,
  routes,
  areas,
}: DeveloperTabProps) {
  return (
    <div className="animate-fade-in space-y-5 text-xs">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 leading-normal text-slate-300">
        <div className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-100">
          <FileCode2 className="h-4 w-4 text-blue-400" />
          Code Exporter & DX comparison
        </div>
        The code below automatically renders your visual configuration
        (including base maps, selected overlay trails, and all custom
        POIs, routes, and polygons) in a standalone index.html
        template!
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
                  Active (Standard mapbox/maptiler style
                  compatibility)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
