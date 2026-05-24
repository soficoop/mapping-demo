export interface POI {
  id: string;
  name: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  color: string;
  icon?: string;
  areaId?: string; // Automatically computed if inside an area
}

export interface Route {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number][]; // [lat, lng]
  color: string;
  weight: number;
}

export interface Area {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number][]; // [lat, lng]
  color: string;
}

export type DrawingMode = "idle" | "add-poi" | "add-route" | "add-area";

export interface MapState {
  center: [number, number]; // [lat, lng]
  zoom: number;
  activeBasemap: string;
  activeOverlays: string[];
  library: "leaflet" | "maplibre";
  clusterMode: "none" | "maplibre-native" | "area-polygons";
}
