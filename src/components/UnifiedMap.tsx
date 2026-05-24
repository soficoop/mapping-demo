import { useEffect, useRef } from "react"
import L from "leaflet"
import maplibregl from "maplibre-gl"
import type { POI, Route, Area, DrawingMode } from "@/lib/types"
import { BASEMAPS, OVERLAYS } from "@/lib/providers"
import { isPointInPolygon } from "@/lib/geoUtils"

interface UnifiedMapProps {
  library: "leaflet" | "maplibre"
  activeBasemap: string
  activeOverlays: string[]
  pois: POI[]
  routes: Route[]
  areas: Area[]
  center: [number, number]
  zoom: number
  drawingMode: DrawingMode
  tempCoordinates: [number, number][]
  clusterMode: "none" | "maplibre-native" | "area-polygons"
  onMapClick: (lat: number, lng: number) => void
  onMoveEnd: (center: [number, number], zoom: number) => void
}

// Centroid of area polygon
function getPolygonCentroid(pts: [number, number][]): [number, number] {
  if (pts.length === 0) return [0, 0]
  let latSum = 0
  let lngSum = 0
  pts.forEach(([lat, lng]) => {
    latSum += lat
    lngSum += lng
  })
  return [latSum / pts.length, lngSum / pts.length]
}

// Clean tile urls for MapLibre
function cleanUrlForMapLibre(url: string): string {
  return url.replace("{s}", "a").replace("{r}", "")
}

// Configure MapLibre GL to support Right-to-Left (RTL) text rendering (e.g. Hebrew, Arabic)
if (
  typeof window !== "undefined" &&
  maplibregl.getRTLTextPluginStatus() === "unavailable"
) {
  maplibregl
    .setRTLTextPlugin(
      "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js",
      true // Lazy load the plugin only when RTL text is encountered
    )
    .catch((error) => {
      console.error("Error loading MapLibre RTL text plugin:", error)
    })
}

// Get marker category details (color, symbol)
export function getCategoryDetails(category: string) {
  switch (category) {
    case "Culture & Religion":
      return { symbol: "🏛️", bg: "bg-amber-500", border: "border-amber-600" }
    case "Food & Drink":
      return { symbol: "🍔", bg: "bg-red-500", border: "border-red-600" }
    case "Nature & Parks":
      return { symbol: "🌳", bg: "bg-green-500", border: "border-green-600" }
    case "Services & Facilities":
      return { symbol: "🔧", bg: "bg-teal-500", border: "border-teal-600" }
    default:
      return { symbol: "📍", bg: "bg-blue-500", border: "border-blue-600" }
  }
}

export function UnifiedMap({
  library,
  activeBasemap,
  activeOverlays,
  pois,
  routes,
  areas,
  center,
  zoom,
  drawingMode,
  tempCoordinates,
  clusterMode,
  onMapClick,
  onMoveEnd,
}: UnifiedMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const currentLibraryRef = useRef<string>("")
  const currentBasemapRef = useRef<string>("")

  // Keep track of the latest callbacks to avoid stale closures in event handlers
  const onMapClickRef = useRef(onMapClick)
  const onMoveEndRef = useRef(onMoveEnd)

  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    onMoveEndRef.current = onMoveEnd
  }, [onMoveEnd])

  // Keep track of Leaflet layers to clear/redraw
  const lfLayersRef = useRef<{
    basemap?: L.TileLayer
    overlays: { [id: string]: L.TileLayer }
    pois: L.Marker[]
    routes: L.Polyline[]
    areas: L.Polygon[]
    drawMarkers: L.Marker[]
    drawPolyline?: L.Polyline
    drawPolygon?: L.Polygon
    areaClusters: L.Marker[]
  }>({
    overlays: {},
    pois: [],
    routes: [],
    areas: [],
    drawMarkers: [],
    areaClusters: [],
  })

  // Keep track of MapLibre markers to clear
  const mlMarkersRef = useRef<maplibregl.Marker[]>([])

  // Calculate area clustering: group POIs into areas they belong to
  const getAreaClusteringData = () => {
    const areaMap: { [areaId: string]: POI[] } = {}
    const unclusteredPois: POI[] = []

    // Initialize map
    areas.forEach((a) => {
      areaMap[a.id] = []
    })

    pois.forEach((poi) => {
      let isInsideAny = false
      for (const area of areas) {
        if (isPointInPolygon([poi.lat, poi.lng], area.coordinates)) {
          areaMap[area.id].push(poi)
          isInsideAny = true
          break // Place in first matching area
        }
      }
      if (!isInsideAny) {
        unclusteredPois.push(poi)
      }
    })

    return { areaMap, unclusteredPois }
  }

  const { areaMap, unclusteredPois } = getAreaClusteringData()

  // 1. Initial Map Creation & Switch
  useEffect(() => {
    if (!containerRef.current) return

    // Clean up previous map if library changed
    if (mapRef.current) {
      if (currentLibraryRef.current === "leaflet") {
        mapRef.current.remove()
      } else if (currentLibraryRef.current === "maplibre") {
        // Clean maplibre markers
        mlMarkersRef.current.forEach((m) => m.remove())
        mlMarkersRef.current = []
        mapRef.current.remove()
      }
      mapRef.current = null
    }

    // Ensure Leaflet starts with a clean DOM node
    if (containerRef.current) {
      delete (containerRef.current as any)._leaflet_id
    }

    currentLibraryRef.current = library
    currentBasemapRef.current = ""

    if (library === "leaflet") {
      // Create Leaflet Map
      const map = L.map(containerRef.current, {
        zoomControl: false, // will add in bottom-right
      }).setView(center, zoom)

      L.control.zoom({ position: "bottomright" }).addTo(map)

      // Track moves
      map.on("moveend", () => {
        const c = map.getCenter()
        onMoveEndRef.current([c.lat, c.lng], map.getZoom())
      })

      // Track clicks
      map.on("click", (e) => {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current = map
    } else {
      // Create MapLibre GL Map
      const selectedBasemap =
        BASEMAPS.find((b) => b.id === activeBasemap) || BASEMAPS[0]

      let styleDef: any = ""
      if (selectedBasemap.isVector) {
        styleDef = selectedBasemap.styleUrl
      } else {
        styleDef = {
          version: 8,
          sources: {
            "raster-tiles": {
              type: "raster",
              tiles: [cleanUrlForMapLibre(selectedBasemap.url || "")],
              tileSize: 256,
              attribution: selectedBasemap.attribution,
            },
          },
          layers: [
            {
              id: "raster-layer",
              type: "raster",
              source: "raster-tiles",
            },
          ],
        }
      }

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: styleDef,
        center: [center[1], center[0]], // MapLibre takes [lng, lat]
        zoom: zoom - 1, // MapLibre zoom standard is slightly wider
      })

      map.addControl(new maplibregl.NavigationControl(), "bottom-right")

      map.on("moveend", () => {
        const c = map.getCenter()
        onMoveEndRef.current([c.lat, c.lng], Math.round(map.getZoom() + 1))
      })

      map.on("click", (e) => {
        // Only trigger draw/add if clicking empty map
        onMapClickRef.current(e.lngLat.lat, e.lngLat.lng)
      })

      mapRef.current = map
      currentBasemapRef.current = activeBasemap
    }

    return () => {
      // final cleanup on unmount
      if (mapRef.current) {
        if (currentLibraryRef.current === "maplibre") {
          mlMarkersRef.current.forEach((m) => m.remove())
          mlMarkersRef.current = []
        }
        mapRef.current.remove()
        mapRef.current = null
      }
      if (containerRef.current) {
        delete (containerRef.current as any)._leaflet_id
      }
    }
  }, [library])

  // Helper to fly/zoom to coordinate
  const panTo = (lat: number, lng: number, customZoom?: number) => {
    if (!mapRef.current) return
    if (library === "leaflet") {
      mapRef.current.flyTo([lat, lng], customZoom || mapRef.current.getZoom())
    } else {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: customZoom ? customZoom - 1 : mapRef.current.getZoom(),
        essential: true,
      })
    }
  }

  // 2. BaseMap & Overlays update
  useEffect(() => {
    if (!mapRef.current) return

    const selectedBasemap =
      BASEMAPS.find((b) => b.id === activeBasemap) || BASEMAPS[0]

    if (library === "leaflet") {
      const map = mapRef.current as L.Map

      // Remove existing basemap
      if (lfLayersRef.current.basemap) {
        map.removeLayer(lfLayersRef.current.basemap)
      }

      // Add new basemap (if vector basemap, we fall back to a styled OSM layer for Leaflet)
      let url = selectedBasemap.url
      if (selectedBasemap.isVector) {
        // Fallback raster layer for leaflet when vector basemap is active
        url =
          "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      }

      if (url) {
        lfLayersRef.current.basemap = L.tileLayer(url, {
          attribution: selectedBasemap.attribution,
          maxZoom: 19,
        }).addTo(map)
      }

      // Add overlays
      // Remove any overlays not selected
      Object.keys(lfLayersRef.current.overlays).forEach((id) => {
        if (!activeOverlays.includes(id)) {
          map.removeLayer(lfLayersRef.current.overlays[id])
          delete lfLayersRef.current.overlays[id]
        }
      })

      // Add selected overlays
      activeOverlays.forEach((id) => {
        const over = OVERLAYS.find((o) => o.id === id)
        if (over && !lfLayersRef.current.overlays[id]) {
          lfLayersRef.current.overlays[id] = L.tileLayer(over.url, {
            attribution: over.attribution,
            opacity: 0.65,
          }).addTo(map)
        }
      })
    } else {
      const map = mapRef.current as maplibregl.Map

      const updateMapLibreBasemap = () => {
        if (currentBasemapRef.current === activeBasemap) {
          // Basemap didn't change, no need to setStyle again!
          return
        }
        currentBasemapRef.current = activeBasemap

        if (selectedBasemap.isVector) {
          if (selectedBasemap.styleUrl) {
            map.setStyle(selectedBasemap.styleUrl)
          }
        } else {
          // Construct basic raster style
          const rasterStyle = {
            version: 8,
            sources: {
              "raster-tiles": {
                type: "raster" as const,
                tiles: [cleanUrlForMapLibre(selectedBasemap.url || "")],
                tileSize: 256,
                attribution: selectedBasemap.attribution,
              },
            },
            layers: [
              {
                id: "raster-layer",
                type: "raster" as const,
                source: "raster-tiles",
              },
            ],
          }
          map.setStyle(rasterStyle as any)
        }
      }

      if (map.isStyleLoaded()) {
        updateMapLibreBasemap()
      } else {
        map.once("style.load", updateMapLibreBasemap)
      }
    }
  }, [activeBasemap, activeOverlays, library])

  // 3. Render Custom Features (POIs, Routes, Areas, Clusters)
  useEffect(() => {
    if (!mapRef.current) return

    if (library === "leaflet") {
      const map = mapRef.current as L.Map

      // Clear previous layers
      lfLayersRef.current.pois.forEach((layer) => map.removeLayer(layer))
      lfLayersRef.current.routes.forEach((layer) => map.removeLayer(layer))
      lfLayersRef.current.areas.forEach((layer) => map.removeLayer(layer))
      lfLayersRef.current.areaClusters.forEach((layer) =>
        map.removeLayer(layer)
      )

      lfLayersRef.current.pois = []
      lfLayersRef.current.routes = []
      lfLayersRef.current.areas = []
      lfLayersRef.current.areaClusters = []

      // Render Areas (Polygons)
      areas.forEach((area) => {
        const polygon = L.polygon(area.coordinates, {
          color: area.color,
          fillColor: area.color,
          fillOpacity: 0.2,
          weight: 2.5,
          interactive: drawingMode === "idle", // Disable interaction when drawing
        })
          .bindPopup(
            `<div class="p-1">
              <h3 class="font-bold text-sm text-foreground">${area.name}</h3>
              <p class="text-xs text-muted-foreground my-1">${area.description || "No description"}</p>
            </div>`
          )
          .addTo(map)

        lfLayersRef.current.areas.push(polygon)
      })

      // Render Routes (Polylines)
      routes.forEach((route) => {
        const polyline = L.polyline(route.coordinates, {
          color: route.color,
          weight: route.weight,
          opacity: 0.8,
          interactive: drawingMode === "idle", // Disable interaction when drawing
        })
          .bindPopup(
            `<div class="p-1">
              <h3 class="font-bold text-sm text-foreground">${route.name}</h3>
              <p class="text-xs text-muted-foreground my-1">${route.description || "No description"}</p>
            </div>`
          )
          .addTo(map)

        lfLayersRef.current.routes.push(polyline)
      })

      // Render POIs and/or Area Clusters
      if (clusterMode === "area-polygons") {
        // Render Area Clusters (Centroid badges)
        areas.forEach((area) => {
          const areaPois = areaMap[area.id] || []
          if (areaPois.length > 0) {
            const centroid = getPolygonCentroid(area.coordinates)
            const breakdown = areaPois.reduce(
              (acc: { [cat: string]: number }, cur) => {
                acc[cur.category] = (acc[cur.category] || 0) + 1
                return acc
              },
              {}
            )

            const breakdownHtml = Object.entries(breakdown)
              .map(
                ([cat, count]) =>
                  `<div>${getCategoryDetails(cat).symbol} ${cat}: <b>${count}</b></div>`
              )
              .join("")

            const clusterMarker = L.marker(centroid, {
              icon: L.divIcon({
                html: `<div class="relative flex items-center justify-center bg-primary text-primary-foreground font-extrabold rounded-full border-2 border-white shadow-lg cursor-pointer" style="width: 38px; height: 38px; font-size: 14px;">
                  ${areaPois.length}
                  <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                  </span>
                </div>`,
                className: "area-cluster-div-icon",
                iconSize: [38, 38],
                iconAnchor: [19, 19],
              }),
              interactive: drawingMode === "idle", // Disable interaction when drawing
            })
              .bindPopup(
                `<div class="p-2 leading-snug">
                  <h4 class="font-bold text-sm text-primary border-b border-border pb-1 mb-1">${area.name} Cluster</h4>
                  <div class="text-xs space-y-1 mb-2">
                    ${breakdownHtml}
                  </div>
                  <button id="zoom-area-${area.id}" class="w-full text-center bg-primary text-primary-foreground text-xs font-semibold py-1 px-2 rounded hover:bg-primary/95 transition-all cursor-pointer">
                    Inspect Cluster Elements
                  </button>
                </div>`
              )
              .addTo(map)

            // Fly to area on button click inside popup
            clusterMarker.on("popupopen", () => {
              const btn = document.getElementById(`zoom-area-${area.id}`)
              if (btn) {
                btn.onclick = (e) => {
                  e.stopPropagation()
                  map.closePopup()
                  // Fit bounds of area
                  const bounds = L.latLngBounds(area.coordinates)
                  map.fitBounds(bounds, { padding: [50, 50] })
                }
              }
            })

            lfLayersRef.current.areaClusters.push(clusterMarker)
          }
        })

        // Only draw POIs that are NOT in any area
        unclusteredPois.forEach((poi) => {
          const details = getCategoryDetails(poi.category)
          const marker = L.marker([poi.lat, poi.lng], {
            icon: L.divIcon({
              html: `<div class="flex items-center justify-center ${details.bg} rounded-full border border-white text-base shadow-md hover:scale-110 transition-transform cursor-pointer" style="width: 28px; height: 28px;">
                ${details.symbol}
              </div>`,
              className: "poi-div-icon",
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            }),
            interactive: drawingMode === "idle", // Disable interaction when drawing
          })
            .bindPopup(
              `<div class="p-1">
                <h3 class="font-bold text-sm text-foreground">${poi.name}</h3>
                <span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${details.bg} text-white">${poi.category}</span>
                <p class="text-xs text-muted-foreground mt-2">${poi.description || "No description"}</p>
              </div>`
            )
            .addTo(map)

          lfLayersRef.current.pois.push(marker)
        })
      } else {
        // Render ALL POIs normally
        pois.forEach((poi) => {
          const details = getCategoryDetails(poi.category)
          const marker = L.marker([poi.lat, poi.lng], {
            icon: L.divIcon({
              html: `<div class="flex items-center justify-center ${details.bg} rounded-full border border-white text-base shadow-md hover:scale-110 transition-transform cursor-pointer" style="width: 28px; height: 28px;">
                ${details.symbol}
              </div>`,
              className: "poi-div-icon",
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            }),
            interactive: drawingMode === "idle", // Disable interaction when drawing
          })
            .bindPopup(
              `<div class="p-1">
                <h3 class="font-bold text-sm text-foreground">${poi.name}</h3>
                <span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${details.bg} text-white">${poi.category}</span>
                <p class="text-xs text-muted-foreground mt-2">${poi.description || "No description"}</p>
              </div>`
            )
            .addTo(map)

          lfLayersRef.current.pois.push(marker)
        })
      }
    } else {
      // MapLibre Rendering
      const map = mapRef.current as maplibregl.Map

      const renderMapLibreFeatures = () => {
        // Remove existing custom markers
        mlMarkersRef.current.forEach((m) => m.remove())
        mlMarkersRef.current = []

        // Remove previous sources & layers if they exist
        const safeRemoveLayer = (id: string) => {
          if (map.getLayer(id)) map.removeLayer(id)
        }
        const safeRemoveSource = (id: string) => {
          if (map.getSource(id)) map.removeSource(id)
        }

        // Remove previous overlays
        OVERLAYS.forEach((over) => {
          safeRemoveLayer(`overlay-layer-${over.id}`)
          safeRemoveSource(`overlay-source-${over.id}`)
        })

        // Layers removal list
        safeRemoveLayer("areas-fill")
        safeRemoveLayer("areas-outline")
        safeRemoveSource("areas-source")

        safeRemoveLayer("routes-layer")
        safeRemoveSource("routes-source")

        safeRemoveLayer("native-clusters")
        safeRemoveLayer("native-cluster-count")
        safeRemoveLayer("unclustered-point")
        safeRemoveSource("pois-source")

        // 0. Add Active Overlays (so they render below custom features)
        activeOverlays.forEach((id) => {
          const over = OVERLAYS.find((o) => o.id === id)
          if (over) {
            const sourceId = `overlay-source-${over.id}`
            const layerId = `overlay-layer-${over.id}`

            map.addSource(sourceId, {
              type: "raster",
              tiles: [cleanUrlForMapLibre(over.url)],
              tileSize: 256,
              attribution: over.attribution,
            })

            map.addLayer({
              id: layerId,
              type: "raster",
              source: sourceId,
              paint: {
                "raster-opacity": 0.65,
              },
            })
          }
        })

        // 1. Add Areas (Polygons)
        const areaFeatures = areas.map((area) => ({
          type: "Feature",
          properties: {
            id: area.id,
            name: area.name,
            description: area.description,
            color: area.color,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                ...area.coordinates.map(([lat, lng]) => [lng, lat]),
                [area.coordinates[0][1], area.coordinates[0][0]], // close polygon
              ],
            ],
          },
        }))

        if (areaFeatures.length > 0) {
          map.addSource("areas-source", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: areaFeatures as any,
            },
          })

          map.addLayer({
            id: "areas-fill",
            type: "fill",
            source: "areas-source",
            paint: {
              "fill-color": ["get", "color"],
              "fill-opacity": 0.15,
            },
          })

          map.addLayer({
            id: "areas-outline",
            type: "line",
            source: "areas-source",
            paint: {
              "line-color": ["get", "color"],
              "line-width": 2,
            },
          })

          // Area Clicks
          map.on("click", "areas-fill", (e) => {
            if (drawingMode !== "idle") return // ignore click when drawing
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["areas-fill"],
            })
            if (features.length > 0) {
              const props = features[0].properties
              new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(
                  `<div class="p-1">
                    <h3 class="font-bold text-sm text-foreground">${props.name}</h3>
                    <p class="text-xs text-muted-foreground my-1">${props.description || ""}</p>
                  </div>`
                )
                .addTo(map)
            }
          })
        }

        // 2. Add Routes (Polylines)
        const routeFeatures = routes.map((route) => ({
          type: "Feature",
          properties: {
            id: route.id,
            name: route.name,
            description: route.description,
            color: route.color,
            weight: route.weight,
          },
          geometry: {
            type: "LineString",
            coordinates: route.coordinates.map(([lat, lng]) => [lng, lat]),
          },
        }))

        if (routeFeatures.length > 0) {
          map.addSource("routes-source", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: routeFeatures as any,
            },
          })

          map.addLayer({
            id: "routes-layer",
            type: "line",
            source: "routes-source",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": ["get", "color"],
              "line-width": ["get", "weight"],
              "line-opacity": 0.8,
            },
          })

          // Route clicks
          map.on("click", "routes-layer", (e) => {
            if (drawingMode !== "idle") return
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["routes-layer"],
            })
            if (features.length > 0) {
              const props = features[0].properties
              new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(
                  `<div class="p-1">
                    <h3 class="font-bold text-sm text-foreground">${props.name}</h3>
                    <p class="text-xs text-muted-foreground my-1">${props.description || ""}</p>
                  </div>`
                )
                .addTo(map)
            }
          })
        }

        // 3. Render POIs (Individual, MapLibre Native Clustering, or Polygon Area Clustering)
        if (clusterMode === "maplibre-native") {
          // Native maplibre clustering via GeoJSON source
          const poiFeatures = pois.map((poi) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [poi.lng, poi.lat],
            },
            properties: {
              name: poi.name,
              category: poi.category,
              description: poi.description,
              color: poi.color,
            },
          }))

          map.addSource("pois-source", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: poiFeatures as any,
            },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          })

          // Cluster circle layer
          map.addLayer({
            id: "native-clusters",
            type: "circle",
            source: "pois-source",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#020817",
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20, // size for < 10 points
                10,
                30, // size for 10-50 points
                50,
                40, // size for >= 50 points
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          })

          // Cluster count layer
          map.addLayer({
            id: "native-cluster-count",
            type: "symbol",
            source: "pois-source",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count}",
              "text-font": ["Inter Variable", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
            paint: {
              "text-color": "#ffffff",
            },
          })

          // Unclustered points layer
          map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "pois-source",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": ["get", "color"],
              "circle-radius": 8,
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#fff",
            },
          })

          // Click on clusters zooms in
          map.on("click", "native-clusters", async (e) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["native-clusters"],
            })
            const clusterId = features[0].properties.cluster_id
            const source = map.getSource(
              "pois-source"
            ) as maplibregl.GeoJSONSource

            try {
              const zoom = await source.getClusterExpansionZoom(clusterId)
              map.easeTo({
                center: e.lngLat,
                zoom: zoom,
              })
            } catch (err) {
              console.error("Cluster expansion failed", err)
            }
          })

          // Click on unclustered points opens popup
          map.on("click", "unclustered-point", (e) => {
            if (drawingMode !== "idle") return
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["unclustered-point"],
            })
            if (features.length > 0) {
              const props = features[0].properties
              const details = getCategoryDetails(props.category)
              new maplibregl.Popup({ offset: 10 })
                .setLngLat(e.lngLat)
                .setHTML(
                  `<div class="p-1">
                    <h3 class="font-bold text-sm text-foreground">${props.name}</h3>
                    <span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${details.bg} text-white">${props.category}</span>
                    <p class="text-xs text-muted-foreground mt-2">${props.description || ""}</p>
                  </div>`
                )
                .addTo(map)
            }
          })
        } else if (clusterMode === "area-polygons") {
          // Render Area Centroid Clusters using DOM Markers
          areas.forEach((area) => {
            const areaPois = areaMap[area.id] || []
            if (areaPois.length > 0) {
              const centroid = getPolygonCentroid(area.coordinates)
              const breakdown = areaPois.reduce(
                (acc: { [cat: string]: number }, cur) => {
                  acc[cur.category] = (acc[cur.category] || 0) + 1
                  return acc
                },
                {}
              )

              const breakdownHtml = Object.entries(breakdown)
                .map(
                  ([cat, count]) =>
                    `<div>${getCategoryDetails(cat).symbol} ${cat}: <b>${count}</b></div>`
                )
                .join("")

              // Build HTML Element
              const el = document.createElement("div")
              el.className =
                "relative flex items-center justify-center bg-primary text-primary-foreground font-extrabold rounded-full border-2 border-white shadow-lg cursor-pointer"
              el.style.width = "38px"
              el.style.height = "38px"
              el.style.fontSize = "14px"
              el.innerHTML = `
                ${areaPois.length}
                <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                </span>
              `

              const popup = new maplibregl.Popup({ offset: 15 }).setHTML(
                `<div class="p-2 leading-snug">
                  <h4 class="font-bold text-sm text-primary border-b border-border pb-1 mb-1">${area.name} Cluster</h4>
                  <div class="text-xs space-y-1 mb-2 text-foreground">
                    ${breakdownHtml}
                  </div>
                  <button id="zoom-area-ml-${area.id}" class="w-full text-center bg-primary text-primary-foreground text-xs font-semibold py-1 px-2 rounded hover:bg-primary/95 transition-all cursor-pointer">
                    Inspect Cluster Elements
                  </button>
                </div>`
              )

              const marker = new maplibregl.Marker(el)
                .setLngLat([centroid[1], centroid[0]])
                .setPopup(popup)
                .addTo(map)

              popup.on("open", () => {
                const btn = document.getElementById(`zoom-area-ml-${area.id}`)
                if (btn) {
                  btn.onclick = (e) => {
                    e.stopPropagation()
                    popup.remove()
                    // Fit bounds in MapLibre
                    const bounds = new maplibregl.LngLatBounds()
                    area.coordinates.forEach(([lat, lng]) =>
                      bounds.extend([lng, lat])
                    )
                    map.fitBounds(bounds, { padding: 60 })
                  }
                }
              })

              mlMarkersRef.current.push(marker)
            }
          })

          // Render only unclustered POIs as normal markers
          unclusteredPois.forEach((poi) => {
            const details = getCategoryDetails(poi.category)

            const el = document.createElement("div")
            el.style.width = "28px"
            el.style.height = "28px"

            const inner = document.createElement("div")
            inner.className = `flex h-full w-full items-center justify-center ${details.bg} rounded-full border border-white text-base shadow-md hover:scale-110 transition-transform cursor-pointer`
            inner.innerHTML = details.symbol
            el.appendChild(inner)

            const marker = new maplibregl.Marker(el)
              .setLngLat([poi.lng, poi.lat])
              .setPopup(
                new maplibregl.Popup({ offset: 15 }).setHTML(
                  `<div class="p-1 text-foreground">
                    <h3 class="font-bold text-sm">${poi.name}</h3>
                    <span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${details.bg} text-white">${poi.category}</span>
                    <p class="text-xs text-muted-foreground mt-2">${poi.description || "No description"}</p>
                  </div>`
                )
              )
              .addTo(map)

            mlMarkersRef.current.push(marker)
          })
        } else {
          // Normal mode: Render all POIs as HTML markers
          pois.forEach((poi) => {
            const details = getCategoryDetails(poi.category)

            const el = document.createElement("div")
            el.style.width = "28px"
            el.style.height = "28px"

            const inner = document.createElement("div")
            inner.className = `flex h-full w-full items-center justify-center ${details.bg} rounded-full border border-white text-base shadow-md hover:scale-110 transition-transform cursor-pointer`
            inner.innerHTML = details.symbol
            el.appendChild(inner)

            const marker = new maplibregl.Marker(el)
              .setLngLat([poi.lng, poi.lat])
              .setPopup(
                new maplibregl.Popup({ offset: 15 }).setHTML(
                  `<div class="p-1 text-foreground">
                    <h3 class="font-bold text-sm">${poi.name}</h3>
                    <span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${details.bg} text-white">${poi.category}</span>
                    <p class="text-xs text-muted-foreground mt-2">${poi.description || "No description"}</p>
                  </div>`
                )
              )
              .addTo(map)

            mlMarkersRef.current.push(marker)
          })
        }
      }

      if (map.isStyleLoaded()) {
        renderMapLibreFeatures()
      } else {
        map.once("idle", renderMapLibreFeatures)
      }
    }
  }, [
    pois,
    routes,
    areas,
    clusterMode,
    library,
    activeBasemap,
    activeOverlays,
    drawingMode,
  ])

  // 4. Render active/temporary Drawing Coordinates (Polyline/Polygon preview)
  useEffect(() => {
    if (!mapRef.current) return

    if (library === "leaflet") {
      const map = mapRef.current as L.Map

      // Clean up past drawing layers
      lfLayersRef.current.drawMarkers.forEach((m) => map.removeLayer(m))
      lfLayersRef.current.drawMarkers = []

      if (lfLayersRef.current.drawPolyline) {
        map.removeLayer(lfLayersRef.current.drawPolyline)
        lfLayersRef.current.drawPolyline = undefined
      }
      if (lfLayersRef.current.drawPolygon) {
        map.removeLayer(lfLayersRef.current.drawPolygon)
        lfLayersRef.current.drawPolygon = undefined
      }

      if (tempCoordinates.length === 0) return

      // Draw vertices as small circle indicators
      tempCoordinates.forEach(([lat, lng]) => {
        const drawMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div class="bg-red-500 w-2.5 h-2.5 rounded-full border border-white shadow-md"></div>`,
            className: "draw-vertex-icon",
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          }),
        }).addTo(map)
        lfLayersRef.current.drawMarkers.push(drawMarker)
      })

      // Draw preview geometry
      if (drawingMode === "add-route" && tempCoordinates.length > 1) {
        lfLayersRef.current.drawPolyline = L.polyline(tempCoordinates, {
          color: "#dc2626", // red-600
          weight: 4,
          dashArray: "5, 10",
        }).addTo(map)
      } else if (drawingMode === "add-area" && tempCoordinates.length > 1) {
        lfLayersRef.current.drawPolygon = L.polygon(tempCoordinates, {
          color: "#dc2626",
          fillColor: "#dc2626",
          fillOpacity: 0.15,
          dashArray: "5, 10",
          weight: 2,
        }).addTo(map)
      }
    } else {
      // MapLibre Drawing Preview
      const map = mapRef.current as maplibregl.Map

      const updateMapLibreDrawing = () => {
        const safeRemoveLayer = (id: string) => {
          if (map.getLayer(id)) map.removeLayer(id)
        }
        const safeRemoveSource = (id: string) => {
          if (map.getSource(id)) map.removeSource(id)
        }

        safeRemoveLayer("draw-fill")
        safeRemoveLayer("draw-line")
        safeRemoveLayer("draw-points")
        safeRemoveSource("draw-temp-source")

        if (tempCoordinates.length === 0) return

        // Points list for vertices
        const pointsGeoJson = {
          type: "FeatureCollection",
          features: tempCoordinates.map(([lat, lng]) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            properties: {},
          })),
        }

        // Line or Polygon GeoJSON
        let lineOrPolyGeoJson: any = null

        if (drawingMode === "add-route" && tempCoordinates.length > 1) {
          lineOrPolyGeoJson = {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: tempCoordinates.map(([lat, lng]) => [lng, lat]),
            },
            properties: {},
          }
        } else if (drawingMode === "add-area" && tempCoordinates.length > 1) {
          // Close polygon
          const coords = tempCoordinates.map(([lat, lng]) => [lng, lat])
          coords.push([tempCoordinates[0][1], tempCoordinates[0][0]])
          lineOrPolyGeoJson = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [coords],
            },
            properties: {},
          }
        }

        // Add source holding both points and the line/polygon preview
        const combinedData = {
          type: "FeatureCollection",
          features: [
            ...pointsGeoJson.features,
            ...(lineOrPolyGeoJson ? [lineOrPolyGeoJson] : []),
          ],
        }

        map.addSource("draw-temp-source", {
          type: "geojson",
          data: combinedData as any,
        })

        // Add visual layers for drawing preview
        if (drawingMode === "add-area") {
          map.addLayer({
            id: "draw-fill",
            type: "fill",
            source: "draw-temp-source",
            filter: ["==", ["geometry-type"], "Polygon"],
            paint: {
              "fill-color": "#dc2626",
              "fill-opacity": 0.15,
            },
          })
        }

        map.addLayer({
          id: "draw-line",
          type: "line",
          source: "draw-temp-source",
          filter: [
            "in",
            ["geometry-type"],
            ["literal", ["LineString", "Polygon"]],
          ],
          paint: {
            "line-color": "#dc2626",
            "line-width": 3,
            "line-dasharray": [2, 2],
          },
        })

        map.addLayer({
          id: "draw-points",
          type: "circle",
          source: "draw-temp-source",
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-color": "#dc2626",
            "circle-radius": 5,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1,
          },
        })
      }

      if (map.isStyleLoaded()) {
        updateMapLibreDrawing()
      } else {
        map.once("style.load", updateMapLibreDrawing)
      }
    }
  }, [tempCoordinates, drawingMode, library])

  // Render container
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border shadow-sm">
      {/* Map Target Element */}
      <div ref={containerRef} className="h-full w-full bg-slate-50" />

      {/* Drawing Instructions Overlay */}
      {drawingMode !== "idle" && (
        <div className="absolute top-4 left-4 z-[999] animate-pulse rounded-xl border border-rose-500 bg-white/90 px-4 py-3 text-sm shadow-md backdrop-blur dark:bg-slate-950/95">
          <div className="mb-1 flex items-center gap-1.5 font-bold text-rose-600">
            <span className="inline-block h-2.5 w-2.5 animate-ping rounded-full bg-rose-600"></span>
            Drawing Active:{" "}
            {drawingMode === "add-poi"
              ? "Add POI"
              : drawingMode === "add-route"
                ? "Draw Route"
                : "Draw Area Polygon"}
          </div>
          <p className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">
            {drawingMode === "add-poi" &&
              "Click on the map at the exact position of your new Point of Interest."}
            {drawingMode === "add-route" &&
              "Click on the map to add sequential points for your hiking/cycling route. Double-click or click 'Complete' in the sidebar to save."}
            {drawingMode === "add-area" &&
              "Click on the map to place the corners of your region polygon. Double-click or click 'Complete' in the sidebar to close the area."}
          </p>
        </div>
      )}

      {/* Quick Fly-to-Jerusalem Button in bottom-left */}
      <button
        onClick={() => panTo(31.7767, 35.2244, 15)}
        className="absolute bottom-4 left-4 z-[999] flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground shadow-md transition-all hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
        title="Recenter Map to Jerusalem"
      >
        🕌 Recenter Jerusalem
      </button>
    </div>
  )
}
