import type { POI, Area } from "@/lib/types"
import { isPointInPolygon } from "@/lib/geoUtils"
import { getCategoryDetails } from "@/lib/utils"

interface ClustersTabProps {
  pois: POI[]
  areas: Area[]
}

export function ClustersTab({ pois, areas }: ClustersTabProps) {
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
    <div className="animate-fade-in space-y-6 text-xs">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 leading-relaxed text-slate-600 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-slate-400">
        <h4 className="mb-1 flex items-center gap-1 font-bold text-indigo-800 dark:text-indigo-400">
          💡 How Area Clustering Works
        </h4>
        Any Point of Interest (POI) whose coordinates fall inside a drawn
        district polygon is dynamically grouped into that area's cluster. This
        is perfect for zoning, tourism, and community planning!
        <div className="mt-2 text-[10px] font-semibold text-slate-500">
          ⚠️ Note: Enable "Custom Polygon Area Clustering" in the Map Style tab
          to visualize these clusters directly on the map viewport!
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold tracking-wider text-slate-400 uppercase">
          Active Polygon Area Groupings ({areas.length})
        </h3>

        {areas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-slate-400 dark:border-slate-800">
            No custom areas drawn yet. Draw an area polygon on the "Draw Tools"
            tab, place some POIs inside it, and view its statistics here!
          </div>
        ) : (
          <div className="space-y-4">
            {areaClusters.map(({ area, pois: clusterPois, categories }) => (
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
                    No POIs currently fall inside this area boundaries.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Category Counts Breakdown */}
                    <div>
                      <div className="mb-1.5 text-[10px] font-extrabold text-slate-400 uppercase">
                        District Category Mix
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(categories).map(([cat, count]) => {
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
                        })}
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
                              {getCategoryDetails(poi.category).symbol}{" "}
                              {poi.name}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 uppercase">
                              {poi.lat.toFixed(4)}, {poi.lng.toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
