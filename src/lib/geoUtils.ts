import type { POI, Route, Area } from "./types"
import { BASEMAPS, OVERLAYS } from "./providers"

// Ray-casting point in polygon algorithm
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [lat, lng] = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1]
    const xj = polygon[j][0],
      yj = polygon[j][1]
    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Convert current state to GeoJSON
export function stateToGeoJSON(pois: POI[], routes: Route[], areas: Area[]) {
  const features: any[] = []

  // Add POIs
  pois.forEach((poi) => {
    features.push({
      type: "Feature",
      properties: {
        type: "poi",
        id: poi.id,
        name: poi.name,
        category: poi.category,
        description: poi.description,
        color: poi.color,
        icon: poi.icon,
      },
      geometry: {
        type: "Point",
        coordinates: [poi.lng, poi.lat], // GeoJSON uses [lng, lat]
      },
    })
  })

  // Add Routes
  routes.forEach((route) => {
    features.push({
      type: "Feature",
      properties: {
        type: "route",
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
    })
  })

  // Add Areas
  areas.forEach((area) => {
    // In GeoJSON polygons, the first and last coordinate must be identical
    const coords = area.coordinates.map(([lat, lng]) => [lng, lat])
    if (coords.length > 0) {
      coords.push([...coords[0]])
    }
    features.push({
      type: "Feature",
      properties: {
        type: "area",
        id: area.id,
        name: area.name,
        description: area.description,
        color: area.color,
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    })
  })

  return {
    type: "FeatureCollection",
    features,
  }
}

// Import from GeoJSON
export function geoJSONToState(geojson: any): {
  pois: POI[]
  routes: Route[]
  areas: Area[]
} {
  const pois: POI[] = []
  const routes: Route[] = []
  const areas: Area[] = []

  if (
    !geojson ||
    geojson.type !== "FeatureCollection" ||
    !Array.isArray(geojson.features)
  ) {
    return { pois, routes, areas }
  }

  geojson.features.forEach((feature: any, index: number) => {
    const props = feature.properties || {}
    const geom = feature.geometry || {}
    const id = props.id || `imported-${Date.now()}-${index}`

    if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
      pois.push({
        id,
        name: props.name || `Imported POI ${index}`,
        category: props.category || "General",
        description: props.description || "",
        lat: geom.coordinates[1],
        lng: geom.coordinates[0],
        color: props.color || "#3b82f6",
        icon: props.icon || "marker",
      })
    } else if (geom.type === "LineString" && Array.isArray(geom.coordinates)) {
      routes.push({
        id,
        name: props.name || `Imported Route ${index}`,
        description: props.description || "",
        coordinates: geom.coordinates.map(([lng, lat]: any) => [lat, lng]),
        color: props.color || "#ef4444",
        weight: props.weight || 4,
      })
    } else if (
      geom.type === "Polygon" &&
      Array.isArray(geom.coordinates) &&
      geom.coordinates[0]
    ) {
      // Remove last duplicate point if it matches first
      let coords = geom.coordinates[0].map(([lng, lat]: any) => [lat, lng])
      if (
        coords.length > 1 &&
        coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1]
      ) {
        coords.pop()
      }
      areas.push({
        id,
        name: props.name || `Imported Area ${index}`,
        description: props.description || "",
        coordinates: coords,
        color: props.color || "#22c55e",
      })
    }
  })

  return { pois, routes, areas }
}

// Generate Leaflet Starter Code
export function generateLeafletCode(
  basemapId: string,
  overlayIds: string[],
  center: [number, number],
  zoom: number,
  pois: POI[],
  routes: Route[],
  areas: Area[]
): string {
  const selectedBasemap =
    BASEMAPS.find((b) => b.id === basemapId) || BASEMAPS[0]
  const basemapUrl =
    selectedBasemap.url || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

  const overlaysJs = overlayIds
    .map((id) => {
      const over = OVERLAYS.find((o) => o.id === id)
      if (!over) return ""
      return `      L.tileLayer('${over.url}', {
        attribution: '${over.attribution}',
        opacity: 0.65
      }).addTo(map);`
    })
    .filter(Boolean)
    .join("\n")

  const poisJs = pois
    .map(
      (poi) => `      // POI: ${poi.name}
      L.marker([${poi.lat}, ${poi.lng}], {
        icon: L.divIcon({
          html: \`<div style="background-color: ${poi.color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">📍</div>\`,
          className: 'custom-div-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      })
      .bindPopup('<b>${poi.name.replace(/'/g, "\\'")}</b><br>${poi.category}<br>${poi.description.replace(/'/g, "\\'")}')
      .addTo(map);`
    )
    .join("\n\n")

  const routesJs = routes
    .map(
      (route) => `      // Route: ${route.name}
      L.polyline(${JSON.stringify(route.coordinates)}, {
        color: '${route.color}',
        weight: ${route.weight},
        opacity: 0.8
      })
      .bindPopup('<b>${route.name.replace(/'/g, "\\'")}</b><br>${route.description.replace(/'/g, "\\'")}')
      .addTo(map);`
    )
    .join("\n\n")

  const areasJs = areas
    .map(
      (area) => `      // Area: ${area.name}
      L.polygon(${JSON.stringify(area.coordinates)}, {
        color: '${area.color}',
        fillColor: '${area.color}',
        fillOpacity: 0.25,
        weight: 2
      })
      .bindPopup('<b>${area.name.replace(/'/g, "\\'")}</b><br>${area.description.replace(/'/g, "\\'")}')
      .addTo(map);`
    )
    .join("\n\n")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leaflet Community Map Playground</title>

  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
  </style>
</head>
<body>

  <div id="map"></div>

  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    // Initialize Map
    const map = L.map('map').setView([${center[0]}, ${center[1]}], ${zoom});

    // Add Selected Base Map
    L.tileLayer('${basemapUrl}', {
      attribution: '${selectedBasemap.attribution}'
    }).addTo(map);

    // Overlays
${overlaysJs ? overlaysJs : "    // No overlays active"}

    // Custom POIs
${poisJs ? poisJs : "    // No custom POIs created"}

    // Custom Routes
${routesJs ? routesJs : "    // No custom routes created"}

    // Custom Areas
${areasJs ? areasJs : "    // No custom areas created"}

  </script>
</body>
</html>`
}

// Generate MapLibre GL Starter Code
export function generateMapLibreCode(
  basemapId: string,
  overlayIds: string[],
  center: [number, number],
  zoom: number,
  pois: POI[],
  routes: Route[],
  areas: Area[]
): string {
  const selectedBasemap =
    BASEMAPS.find((b) => b.id === basemapId) || BASEMAPS[0]

  let styleDefinition = ""
  if (selectedBasemap.isVector) {
    styleDefinition = `'${selectedBasemap.styleUrl}'`
  } else {
    // Fallback style for raster tiles inside MapLibre GL
    styleDefinition = `{
        version: 8,
        sources: {
          'raster-basemap': {
            type: 'raster',
            tiles: ['${selectedBasemap.url?.replace("{s}", "a")}'],
            tileSize: 256,
            attribution: '${selectedBasemap.attribution.replace(/'/g, "\\'")}'
          }
        },
        layers: [
          {
            id: 'basemap-layer',
            type: 'raster',
            source: 'raster-basemap',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      }`
  }

  // Add raster overlays
  const overlaysCode = overlayIds
    .map((id) => {
      const over = OVERLAYS.find((o) => o.id === id)
      if (!over) return ""
      return `      // Add Overlay: ${over.name}
      map.addSource('source-${over.id}', {
        type: 'raster',
        tiles: ['${over.url}'],
        tileSize: 256,
        attribution: '${over.attribution.replace(/'/g, "\\'")}'
      });
      map.addLayer({
        id: 'layer-${over.id}',
        type: 'raster',
        source: 'source-${over.id}',
        paint: { 'raster-opacity': 0.65 }
      });`
    })
    .filter(Boolean)
    .join("\n\n")

  // Construct GeoJSON FeatureCollection for features
  const geojson = stateToGeoJSON(pois, routes, areas)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MapLibre GL Community Map Playground</title>

  <!-- MapLibre GL CSS -->
  <link href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css" rel="stylesheet" />

  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
    .custom-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
    }
  </style>
</head>
<body>

  <div id="map"></div>

  <!-- MapLibre GL JS -->
  <script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>

  <script>
    // Configure MapLibre GL to support Right-to-Left (RTL) text rendering (e.g. Hebrew, Arabic)
    if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
      maplibregl.setRTLTextPlugin(
        'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js',
        true // Lazy load the plugin only when RTL text is encountered
      );
    }

    // Initialize Map
    const map = new maplibregl.Map({
      container: 'map',
      style: ${styleDefinition},
      center: [${center[1]}, ${center[0]}], // Note: MapLibre uses [lng, lat]
      zoom: ${zoom - 1} // MapLibre zoom levels are ~1 shift from Leaflet
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl());

    // GeoJSON Data of your custom features
    const geojsonData = ${JSON.stringify(geojson, null, 2)};

    map.on('load', () => {
      // 1. Add active Overlays
${overlaysCode ? overlaysCode : "      // No overlays active"}

      // 2. Add Areas (Polygons) from GeoJSON
      const areaFeatures = geojsonData.features.filter(f => f.properties.type === 'area');
      if (areaFeatures.length > 0) {
        map.addSource('areas-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: areaFeatures
          }
        });

        // Fill layer
        map.addLayer({
          id: 'areas-fill',
          type: 'fill',
          source: 'areas-source',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.2
          }
        });

        // Outline layer
        map.addLayer({
          id: 'areas-outline',
          type: 'line',
          source: 'areas-source',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2
          }
        });

        // Interactive Click on Areas
        map.on('click', 'areas-fill', (e) => {
          const props = e.features[0].properties;
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(\`<h3>\${props.name}</h3><p>\${props.description}</p>\`)
            .addTo(map);
        });
      }

      // 3. Add Routes (LineStrings) from GeoJSON
      const routeFeatures = geojsonData.features.filter(f => f.properties.type === 'route');
      if (routeFeatures.length > 0) {
        map.addSource('routes-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: routeFeatures
          }
        });

        map.addLayer({
          id: 'routes-layer',
          type: 'line',
          source: 'routes-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['get', 'weight'],
            'line-opacity': 0.8
          }
        });

        // Interactive Click on Routes
        map.on('click', 'routes-layer', (e) => {
          const props = e.features[0].properties;
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(\`<h3>\${props.name}</h3><p>\${props.description}</p>\`)
            .addTo(map);
        });
      }

      // 4. Add POIs as Markers
      const poiFeatures = geojsonData.features.filter(f => f.properties.type === 'poi');
      poiFeatures.forEach(feature => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;

        // Create DOM element for marker
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundColor = props.color;
        el.innerHTML = '📍';

        // Add to map
        new maplibregl.Marker(el)
          .setLngLat(coords)
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(\`<h3>\${props.name}</h3><b>\${props.category}</b><p>\${props.description}</p>\`)
          )
          .addTo(map);
      });
    });
  </script>
</body>
</html>`
}
