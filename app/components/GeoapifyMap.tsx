"use client";

import React, { useEffect, useMemo, useState } from "react";

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

function UserLocationMarker({
  position,
  onClick,
}: {
  position: [number, number];
  onClick?: () => void;
}) {
  // Blue ring / dot marker
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "user-location-marker",
        html: `<div style="background-color:#2563eb; width:16px; height:16px; border-radius:50%; border:3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.25);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10],
      }),
    []
  );

  return (
    <Marker position={position} icon={icon} eventHandlers={onClick ? { click: onClick } : undefined}>
      <Popup>
        <div className="text-sm">
          <strong className="block text-base">You are here</strong>
          <p className="mt-1 text-gray-600">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
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
// Prefer NEXT_PUBLIC_GEOAPIFY_API_KEY from environment (Next.js injects at build time).
// Keep fallback for local/dev.
const NEXT_PUBLIC_GEOAPIFY_API_KEY: string =
  (globalThis as unknown as { __NEXT_PUBLIC_GEOAPIFY_API_KEY?: string }).__NEXT_PUBLIC_GEOAPIFY_API_KEY ??
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_GEOAPIFY_API_KEY ? process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY : "");

function getApiKey() {
  return NEXT_PUBLIC_GEOAPIFY_API_KEY;
}


export default function GeoapifyMap() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.warn("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);


  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [category, setCategory] = useState("commercial.supermarket");

  const API_KEY = getApiKey();

  const tileUrl = useMemo(() => {
    // keep tiles working even if API key is missing (they'll fail gracefully)
    return `https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?&apiKey=${encodeURIComponent(API_KEY)}`;
  }, [API_KEY]);

  const boundingBoxPhuket = "98.25,7.75,98.55,8.20";

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
        ? data.features.map((f: unknown) => {
            const feature = f as {
              id?: unknown;
              geometry?: { coordinates?: [unknown, unknown] } | null;
              properties?: Record<string, unknown> | null;
            };

            const coords = feature?.geometry?.coordinates;
            const props = (feature?.properties ?? {}) as Record<string, unknown>;
            const id = String(props.place_id ?? feature?.id ?? "");


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

  return (
    <div>
      {/* Search + Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search text (e.g., supermarket, cafe, museum)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Category"
        >
          <option value="commercial.supermarket">commercial</option>
          <option value="catering.restaurant">catering/restaurant</option>
          <option value="tourism.hotel">tourism/hotel</option>
          <option value="tourism.attraction">tourism/attraction</option>
          <option value="leisure.shopping">leisure/shopping</option>
        </select>

        <button
          onClick={searchPlaces}
          disabled={loading || !API_KEY}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results Count */}
      {places.length > 0 && (
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Found {places.length} place{places.length !== 1 ? "s" : ""} in Phuket
          </p>
          {selectedPlace && (
            <p className="text-sm text-gray-600">
              Selected: <span className="font-medium text-gray-900">{selectedPlace.name}</span>
            </p>
          )}
        </div>
      )}

      {/* Map */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <MapContainer
          center={DEFAULT_POSITION}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "520px", width: "100%" }}
          className="leaflet-container"
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
                <div className="w-56 text-sm">
                  <strong className="block text-base">{place.name}</strong>
                  {place.formatted && (
                    <p className="mt-1 text-gray-600">{place.formatted}</p>
                  )}
                  {place.categories && place.categories.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Categories: {place.categories.join(", ")}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {selectedPlace && <MapUpdater center={[selectedPlace.lat, selectedPlace.lon]} />}

          {userLocation && (
            <UserLocationMarker position={userLocation} />
          )}

        </MapContainer>
      </div>

      {/* Results List */}
      {places.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Top results</p>
            <p className="text-xs text-gray-500">Showing 6 of {places.length}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.slice(0, 6).map((place) => (
              <button
                key={place.place_id}
                onClick={() => setSelectedPlace(place)}
                className={`group rounded-xl border p-3 text-left transition-colors ${
                  selectedPlace?.place_id === place.place_id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <strong className="block text-sm text-gray-900 group-hover:underline">
                    {place.name}
                  </strong>
                  <span className="mt-0.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-blue-600" />
                </div>
                {place.formatted && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {place.formatted}
                  </p>
                )}
              </button>
            ))}
          </div>
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

