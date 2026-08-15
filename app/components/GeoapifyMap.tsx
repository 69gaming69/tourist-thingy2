"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef, ViewState } from "react-map-gl/maplibre";
import { apiFetch } from "@/lib/api";

export type PlaceCategory =
  | "beach"
  | "temple"
  | "restaurant"
  | "shop"
  | "attraction"
  | "nature"
  | "nightlife"
  | "other";

interface PlaceResult {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  description?: string;
  is_promoted?: boolean;
  image_url?: string;
}

type MapPlacePayload = {
  id: number | string;
  name: string;
  category: PlaceCategory;
  latitude: number | string;
  longitude: number | string;
  description?: string;
  is_promoted?: boolean;
  image_url?: string;
};

const DEFAULT_POSITION: { latitude: number; longitude: number } = {
  latitude: 7.8804,
  longitude: 98.3923,
};
const DEFAULT_ZOOM = 12;

const PLACE_CARDS: PlaceResult[] = [
  {
    id: "phuket_old_town",
    name: "Phuket Old Town",
    latitude: 7.894,
    longitude: 98.3925,
    category: "attraction",
    description: "Colorful streets, cafes, and street art in historical Phuket.",
  },
  {
    id: "patong_beach",
    name: "Patong Beach",
    latitude: 7.896,
    longitude: 98.2984,
    category: "beach",
    description: "Lively sand, blue water, and a beautiful free beach boardwalk.",
  },
  {
    id: "big_buddha",
    name: "Big Buddha Phuket",
    latitude: 7.8278,
    longitude: 98.3124,
    category: "attraction",
    description: "A serene hilltop landmark with panoramic island views.",
  },
  {
    id: "chalong_bay_hotel",
    name: "Chalong Bay Hotel",
    latitude: 7.8339,
    longitude: 98.3434,
    category: "other",
    description: "Calm stay near Chalong pier and island tours.",
  },
  {
    id: "local_cafe",
    name: "Rustic Coffee Bar",
    latitude: 7.8831,
    longitude: 98.3849,
    category: "restaurant",
    description: "A cozy spot for strong coffee and local pastries.",
  },
  {
    id: "central_patong",
    name: "Central Phuket Mall",
    latitude: 7.9009,
    longitude: 98.2972,
    category: "shop",
    description: "Modern mall with boutiques, dining, and a textured skylight.",
  },
];

const CATEGORY_LABELS: Record<PlaceCategory | "all", string> = {
  all: "All",
  beach: "Beach",
  temple: "Temple",
  restaurant: "Restaurant",
  shop: "Shop",
  attraction: "Attraction",
  nature: "Nature",
  nightlife: "Nightlife",
  other: "Other",
};

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  beach: "#38bdf8",
  temple: "#f59e0b",
  restaurant: "#f97316",
  shop: "#10b981",
  attraction: "#7c3aed",
  nature: "#22c55e",
  nightlife: "#ec4899",
  other: "#64748b",
};

const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    "esri-satellite": {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
  },
  layers: [
    {
      id: "esri-satellite-layer",
      type: "raster" as const,
      source: "esri-satellite" as const,
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function normalizePlace(place: MapPlacePayload): PlaceResult {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    latitude: toNumber(place.latitude),
    longitude: toNumber(place.longitude),
    description: place.description ?? "",
    is_promoted: place.is_promoted,
    image_url: place.image_url,
  };
}

export default function GeoapifyMap() {
  const mapRef = useRef<MapRef | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    latitude: DEFAULT_POSITION.latitude,
    longitude: DEFAULT_POSITION.longitude,
    zoom: DEFAULT_ZOOM,
  });
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (category !== "all") params.set("category", category);
      const query = params.toString();
      const path = `/api/places/map/${query ? `?${query}` : ""}`;

      try {
        const data = await apiFetch<MapPlacePayload[]>(path);
        if (cancelled) return;
        setPlaces(data.map(normalizePlace));
        setUsingFallback(false);
      } catch {
        if (cancelled) return;
        setPlaces(PLACE_CARDS);
        setUsingFallback(true);
        setError("Could not load places from the API. Showing sample locations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPlaces();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, category]);

  useEffect(() => {
    if (!mapRef.current || !selectedPlace || !isMapLoaded) return;
    try {
      mapRef.current.stop();
      mapRef.current.flyTo({
        center: [selectedPlace.longitude, selectedPlace.latitude],
        zoom: DEFAULT_ZOOM,
        duration: 1000,
      });
    } catch {
      // Map may not be ready yet; ignore transient camera errors.
    }
  }, [selectedPlace?.id, isMapLoaded]);

  const visiblePlaces = useMemo(() => {
    if (!usingFallback) return places;
    const query = searchQuery.trim().toLowerCase();
    return places.filter((place) => {
      const matchesCategory = category === "all" || place.category === category;
      const matchesSearch =
        !query ||
        place.name.toLowerCase().includes(query) ||
        (place.description ?? "").toLowerCase().includes(query) ||
        CATEGORY_LABELS[place.category].toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [places, usingFallback, searchQuery, category]);

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, []);

  return (
    <div className="space-y-6 font-['Inter',system-ui,sans-serif]">
      <div
        className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50/80 p-5 
                    shadow-[0_20px_60px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] 
                    backdrop-blur-sm transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl 
                        bg-gradient-to-br from-emerald-400 to-emerald-600 
                        shadow-[0_8px_18px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]"
          >
            <svg className="h-5 w-5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
              Explore Phuket
            </p>
            <p className="text-xs font-medium text-slate-600">
              Search beaches, temples, restaurants &amp; more
            </p>
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search beach, temple, restaurant, or attraction"
            className="w-full rounded-2xl border border-slate-200/80 bg-[#edf7ed] px-5 py-3.5 text-sm 
                       text-slate-900 outline-none transition duration-200 
                       shadow-[inset_0_2px_6px_rgba(15,23,42,0.06)]
                       placeholder:text-slate-400
                       focus:border-emerald-300 focus:shadow-[inset_0_2px_6px_rgba(16,185,129,0.12),0_0_0_3px_rgba(16,185,129,0.12)]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {(Object.keys(CATEGORY_LABELS) as Array<PlaceCategory | "all">).map((value) => {
          const isActive = category === value;
          const color = value === "all" ? "#10b981" : CATEGORY_COLORS[value as PlaceCategory];

          return (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={[
                "relative rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "text-white shadow-[0_12px_28px_rgba(0,0,0,0.15)] scale-105"
                  : "bg-gradient-to-b from-white to-slate-50 text-slate-700 border-slate-200/80 shadow-[0_2px_4px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 active:translate-y-0",
              ].join(" ")}
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                      borderColor: color,
                    }
                  : undefined
              }
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-[1px]" />
              )}
              <span className="relative z-10">{CATEGORY_LABELS[value]}</span>
            </button>
          );
        })}
      </div>

      <div
        className="overflow-hidden rounded-[32px] 
                    shadow-[0_30px_80px_rgba(15,23,42,0.10),0_10px_30px_rgba(15,23,42,0.06),-4px_-4px_16px_rgba(255,255,255,0.8)]
                    border border-slate-200/60 bg-white transition-all duration-300"
      >
        <div className="relative h-[540px] w-full">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 text-sm font-medium text-slate-600">
              Loading places…
            </div>
          )}
          {error && !loading && (
            <div className="absolute left-4 right-4 top-4 z-20 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}
          <Map
            ref={mapRef}
            mapLib={import("maplibre-gl")}
            mapStyle={SATELLITE_STYLE}
            initialViewState={{
              latitude: DEFAULT_POSITION.latitude,
              longitude: DEFAULT_POSITION.longitude,
              zoom: DEFAULT_ZOOM,
            }}
            style={{ width: "100%", height: "100%" }}
            onLoad={handleMapLoad}
            onMove={(evt) => setViewState(evt.viewState)}
            attributionControl={false}
            scrollZoom
            dragPan
            doubleClickZoom
            touchZoomRotate
          >
            <div className="absolute right-4 top-4 z-10">
              <NavigationControl
                position="top-right"
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                  background: "white",
                }}
              />
            </div>

            {userLocation && (
              <Marker
                latitude={userLocation.latitude}
                longitude={userLocation.longitude}
                anchor="center"
              >
                <div
                  className="relative flex h-7 w-7 items-center justify-center"
                  style={{
                    filter: "drop-shadow(0 4px 12px rgba(16,185,129,0.35))",
                  }}
                >
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
                  <div
                    className="relative z-10 h-5 w-5 rounded-full border-[3px] border-white 
                                bg-gradient-to-br from-emerald-400 to-emerald-600 
                                shadow-[0_4px_12px_rgba(16,185,129,0.4)]"
                  />
                </div>
              </Marker>
            )}

            {visiblePlaces.map((place) => {
              const color = CATEGORY_COLORS[place.category] ?? CATEGORY_COLORS.other;
              return (
                <Marker
                  key={place.id}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedPlace(place);
                  }}
                >
                  <button
                    type="button"
                    className="group relative flex cursor-pointer items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
                    style={{
                      filter: `drop-shadow(0 8px 20px ${color}33)`,
                    }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full 
                                  border-[3px] border-white transition-all duration-200
                                  shadow-[0_4px_12px_rgba(15,23,42,0.15)]"
                      style={{
                        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                      }}
                    >
                      <div className="h-3 w-3 rounded-full bg-white/90 shadow-inner" />
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-slate-900/10" />
                  </button>
                </Marker>
              );
            })}

            {selectedPlace && (
              <Popup
                latitude={selectedPlace.latitude}
                longitude={selectedPlace.longitude}
                anchor="bottom"
                offset={[0, -8]}
                closeOnClick={false}
                onClose={() => setSelectedPlace(null)}
                maxWidth="280px"
                className="skeuo-popup"
              >
                <div
                  className="rounded-[20px] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]
                              border border-slate-100"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-xl 
                                  shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                      style={{
                        background: `linear-gradient(135deg, ${CATEGORY_COLORS[selectedPlace.category]}, ${CATEGORY_COLORS[selectedPlace.category]}cc)`,
                      }}
                    />
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      {CATEGORY_LABELS[selectedPlace.category]}
                    </p>
                  </div>
                  <h3 className="mt-2.5 text-base font-bold text-slate-900">{selectedPlace.name}</h3>
                  {selectedPlace.description ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                      {selectedPlace.description}
                    </p>
                  ) : null}
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50/80 p-6 
                      shadow-[0_20px_50px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] 
                      transition-all duration-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl 
                          bg-gradient-to-br from-emerald-400 to-emerald-600 
                          shadow-[0_6px_14px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                Destination
              </p>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                {selectedPlace?.name ?? "Tap a marker to explore"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 pl-0.5">
            {selectedPlace?.description ||
              "Pick a point on the satellite map to reveal the next Phuket destination."}
          </p>
        </div>

        <div
          className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50/80 p-6 
                      shadow-[0_20px_50px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]
                      transition-all duration-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl 
                          bg-gradient-to-br from-violet-400 to-violet-600 
                          shadow-[0_6px_14px_rgba(124,58,237,0.2),inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                Map Style
              </p>
              <p className="text-lg font-bold text-slate-900 leading-tight">Satellite View</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 pl-0.5">
            Premium satellite imagery powered by MapLibre &amp; ESRI. Rich shadows, tactile surfaces, and polished depth create a skeuomorphic experience.
          </p>
        </div>
      </div>
    </div>
  );
}
