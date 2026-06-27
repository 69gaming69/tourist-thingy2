"use client";

import React, { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js/Webpack
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface PlaceResult {
  place_id: string;
  name: string;
  lat: number;
  lon: number;
  formatted?: string;
  categories?: string[];
  details?: string[];
}

// Default position (Phuket, Thailand)
const DEFAULT_POSITION: [number, number] = [7.8804, 98.3923];

const GEOAPIFY_API_KEY_FALLBACK = "d8c4dd9c65864d37803a77f2cde2c7fc";

function createCustomIcon(category: string) {
  const colors: Record<string, string> = {
    accommodation: "#e11d48",
    restaurant: "#f59e0b",
    attraction: "#8b5cf6",
    shopping: "#10b981",
    transport: "#0ea5e9",
    default: "#64748b",
  };
  const color = colors[category] || colors.default;

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 14);
  return null;
}

function getCategoryFromDetails(details?: string[]): string {
  if (!details) return "default";
  if (details.some((d) => d.includes("hotel") || d.includes("hostel") || d.includes("guesthouse")))
    return "accommodation";
  if (details.some((d) => d.includes("restaurant") || d.includes("cafe") || d.includes("bar")))
    return "restaurant";
  if (details.some((d) => d.includes("tourism") || d.includes("attraction") || d.includes("museum")))
    return "attraction";
  if (details.some((d) => d.includes("shop") || d.includes("mall") || d.includes("market")))
    return "shopping";
  if (details.some((d) => d.includes("bus") || d.includes("taxi") || d.includes("airport")))
    return "transport";
  return "default";
}

// NOTE: We intentionally do not reference `process.env` here because this project
// is currently flagged by TS as not having Node types in the browser bundle.
// Next.js will replace NEXT_PUBLIC_* at build time. Some setups still type-check
// without Node types, so we keep the expression local.
const NEXT_PUBLIC_GEOAPIFY_API_KEY: string =
  (globalThis as unknown as { __NEXT_PUBLIC_GEOAPIFY_API_KEY?: string }).__NEXT_PUBLIC_GEOAPIFY_API_KEY ??
  "";

function getApiKey() {
  return NEXT_PUBLIC_GEOAPIFY_API_KEY || GEOAPIFY_API_KEY_FALLBACK;
}

export default function GeoapifyMap() {
  const [searchQuery, setSearchQuery] = useState("");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [category, setCategory] = useState("commercial.supermarket");

  const API_KEY = getApiKey();

  const tileUrl = useMemo(() => {
    // keep tiles working even if API key is missing (they'll fail gracefully)
    return `https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?&apiKey=${encodeURIComponent(API_KEY)}`;
  }, [API_KEY]);

  const boundingBoxPhuket =
    "10.716463143326969,48.755151258420966,10.835314015356737,48.680903341613316";

  const searchPlaces = async () => {
    if (!searchQuery.trim() && !category.trim()) return;
    if (!API_KEY) return;

    setLoading(true);
    try {
      // Endpoint provided by you:
      // https://api.geoapify.com/v2/places?categories=commercial.supermarket&filter=rect:...&limit=20&apiKey=...
      // We'll extend it with optional text search by adding `text` if provided.

      const url = new URL("https://api.geoapify.com/v2/places");
      url.searchParams.set("limit", "20");
      url.searchParams.set("filter", `rect:${boundingBoxPhuket}`);
      if (category.trim()) {
        url.searchParams.set("categories", category.trim());
      }
      if (searchQuery.trim()) {
        url.searchParams.set("text", searchQuery.trim());
      }
      url.searchParams.set("apiKey", API_KEY);

      const response = await fetch(url.toString());
      const data = await response.json();

      const results: PlaceResult[] = Array.isArray(data?.features)
        ? data.features.map((f: any) => {
            const coords = f?.geometry?.coordinates;
            const props = f?.properties ?? {};
            const id = String(props.place_id ?? f?.id ?? "");

            const lat = typeof coords?.[1] === "number" ? coords[1] : Number(props?.lat);
            const lon = typeof coords?.[0] === "number" ? coords[0] : Number(props?.lon);

            const name = String(props?.name ?? "Unnamed place");

            // Best-effort normalization of category/details.
            const cats = Array.isArray(props?.categories)
              ? props.categories.map(String)
              : typeof props?.category === "string"
                ? [props.category]
                : undefined;

            const details: string[] | undefined = Array.isArray(props?.details)
              ? props.details.map(String)
              : undefined;

            // Some responses include a formatted address.
            const formatted =
              typeof props?.formatted === "string"
                ? props.formatted
                : typeof props?.address_line === "string"
                  ? props.address_line
                  : undefined;

            return {
              place_id: id || name,
              name,
              lat,
              lon,
              formatted,
              categories: cats,
              details,
            };
          })
        : [];

      // filter out invalid points
      const cleaned = results.filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));

      setPlaces(cleaned);
      setSelectedPlace(cleaned[0] ?? null);
    } catch (error) {
      console.error("Error searching places:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchPlaces();
    }
  };

  const mapCenter = selectedPlace
    ? ([selectedPlace.lat, selectedPlace.lon] as [number, number])
    : DEFAULT_POSITION;

  return (
    <div>
      {/* Search + Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search text (e.g., supermarket, cafe, museum)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          aria-label="Category"
        >
          <option value="commercial.supermarket">commercial.supermarket</option>
          <option value="catering.restaurant">catering.restaurant</option>
          <option value="tourism.hotel">tourism.hotel</option>
          <option value="tourism.attraction">tourism.attraction</option>
          <option value="leisure.shopping">leisure.shopping</option>
        </select>

        <button
          onClick={searchPlaces}
          disabled={loading || !API_KEY}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results Count */}
      {places.length > 0 && (
        <p className="mb-2 text-sm text-gray-600">
          Found {places.length} place{places.length !== 1 ? "s" : ""} in Phuket
        </p>
      )}

      {/* Map */}
      <MapContainer
        center={DEFAULT_POSITION}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "500px", width: "100%", borderRadius: "12px" }}
      >
        <TileLayer
          url={tileUrl}
          attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        />

        {places.map((place) => (
          <Marker
            key={place.place_id}
            position={[place.lat, place.lon]}
            icon={createCustomIcon(getCategoryFromDetails(place.details))}
            eventHandlers={{
              click: () => setSelectedPlace(place),
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong className="block text-base">{place.name}</strong>
                {place.formatted && <p className="text-gray-600 mt-1">{place.formatted}</p>}
                {place.categories && place.categories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Categories: {place.categories.join(", ")}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {selectedPlace && <MapUpdater center={[selectedPlace.lat, selectedPlace.lon]} />}
      </MapContainer>

      {/* Results List */}
      {places.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {places.slice(0, 6).map((place) => (
            <button
              key={place.place_id}
              onClick={() => setSelectedPlace(place)}
              className={`p-3 text-left border rounded-lg transition-colors ${
                selectedPlace?.place_id === place.place_id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <strong className="block text-sm">{place.name}</strong>
              {place.formatted && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{place.formatted}</p>}
            </button>
          ))}
        </div>
      )}

      {!API_KEY && (
        <p className="mt-3 text-sm text-red-600">
          Geoapify API key missing. Add NEXT_PUBLIC_GEOAPIFY_API_KEY in your environment.
        </p>
      )}
    </div>
  );
}

