"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef } from "react-map-gl/maplibre";
import { ApiError, apiFetch, unwrapPaginated } from "@/lib/api";
import { useAuth } from "@/app/components/AuthProvider";

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

type CollectibleRarity = "common" | "rare" | "epic" | "legendary";

interface CollectibleResult {
  id: number;
  name: string;
  description: string;
  rarity: CollectibleRarity;
  image_url?: string;
  place: number | null;
  place_name?: string;
  latitude: number;
  longitude: number;
  catch_radius_meters: number;
  xp_reward: number;
  points_reward: number;
  collected: boolean;
}

type CollectiblePayload = Omit<CollectibleResult, "latitude" | "longitude" | "collected"> & {
  latitude: number | string;
  longitude: number | string;
  collected?: boolean;
};

type CollectiblePageResponse = {
  results?: CollectiblePayload[];
  next?: string | null;
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
    description:
      "Colorful streets, cafes, and street art in historical Phuket.",
  },
  {
    id: "patong_beach",
    name: "Patong Beach",
    latitude: 7.896,
    longitude: 98.2984,
    category: "beach",
    description:
      "Lively sand, blue water, and a beautiful free beach boardwalk.",
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
    description:
      "Modern mall with boutiques, dining, and a textured skylight.",
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

const RARITY_LABELS: Record<CollectibleRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const RARITY_COLORS: Record<CollectibleRarity, string> = {
  common: "#34d399",
  rare: "#38bdf8",
  epic: "#a78bfa",
  legendary: "#fbbf24",
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

const STREETS_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function normalizeCollectible(item: CollectiblePayload): CollectibleResult {
  const rarity = (item.rarity in RARITY_COLORS ? item.rarity : "common") as CollectibleRarity;
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    rarity,
    image_url: item.image_url,
    place: item.place,
    place_name: item.place_name,
    latitude: toNumber(item.latitude),
    longitude: toNumber(item.longitude),
    catch_radius_meters: item.catch_radius_meters,
    xp_reward: item.xp_reward,
    points_reward: item.points_reward,
    collected: Boolean(item.collected),
  };
}

async function fetchAllCollectibles(): Promise<CollectibleResult[]> {
  const collected: CollectibleResult[] = [];
  let path: string | null = "/api/collectibles/";

  while (path) {
    const data: CollectiblePayload[] | CollectiblePageResponse = await apiFetch<
      CollectiblePayload[] | CollectiblePageResponse
    >(path);

    if (Array.isArray(data)) {
      return data.map((item: CollectiblePayload) => normalizeCollectible(item));
    }

    const page: CollectiblePageResponse = data;
    collected.push(...unwrapPaginated<CollectiblePayload>(page).map((item: CollectiblePayload) => normalizeCollectible(item)));

    if (!page.next) {
      path = null;
      break;
    }

    try {
      const nextUrl: URL = new URL(page.next, window.location.origin);
      path = `${nextUrl.pathname}${nextUrl.search}`;
    } catch {
      path = null;
    }
  }

  return collected;
}

export default function GeoapifyMap() {
  const mapRef = useRef<MapRef | null>(null);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [mapStyle, setMapStyle] = useState<"satellite" | "street">("satellite");

  // Data
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [collectibles, setCollectibles] = useState<CollectibleResult[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map state
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [selectedCollectible, setSelectedCollectible] = useState<CollectibleResult | null>(null);
  const [collectStatus, setCollectStatus] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Debounce search
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(searchQuery),
      300
    );
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  // Get user location
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

  // Fetch places
  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (debouncedSearch.trim())
        params.set("search", debouncedSearch.trim());
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
        setError(
          "Could not load places from the API. Showing sample locations."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPlaces();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, category]);

  // Fly to selected place
  useEffect(() => {
    let cancelled = false;

    async function loadCollectibles() {
      try {
        const items = await fetchAllCollectibles();
        if (!cancelled) setCollectibles(items);
      } catch {
        if (!cancelled) setCollectibles([]);
      }
    }

    void loadCollectibles();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map?.loaded()) return;
    const target = selectedPlace ?? selectedCollectible;
    if (!target) return;
    if (!Number.isFinite(target.latitude) || !Number.isFinite(target.longitude)) return;
    if (map.isMoving()) return;
    map.easeTo({
      center: [target.longitude, target.latitude],
      duration: 600,
    });
  }, [selectedPlace, selectedCollectible, isMapLoaded]);

  // Filter places (fallback mode needs client-side filtering)
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

  const categoryOptions: Array<PlaceCategory | "all"> = [
    "all",
    "beach",
    "temple",
    "restaurant",
    "shop",
    "attraction",
    "nature",
    "nightlife",
    "other",
  ];

  const categoryButtons = categoryOptions.map((value) => {
    const isActive = category === value;
    return (
      <button
        key={value}
        type="button"
        onClick={() => setCategory(value)}
        className={[
          "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
          isActive
            ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.22)]"
            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-600",
        ].join(" ")}
      >
        {CATEGORY_LABELS[value]}
      </button>
    );
  });

  const handleCollect = useCallback(async () => {
    if (!selectedCollectible) return;
    if (!user) {
      setCollectStatus("Log in to collect this item.");
      return;
    }

    setCollecting(true);
    setCollectStatus(null);

    const coords = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      if (!navigator.geolocation) {
        resolve(userLocation);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve(userLocation),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
      );
    });

    if (!coords) {
      setCollecting(false);
      setCollectStatus("Location is required to collect. Allow GPS and try again.");
      return;
    }

    setUserLocation(coords);

    try {
      await apiFetch(`/api/collectibles/${selectedCollectible.id}/collect/`, {
        method: "POST",
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
      setCollectibles((current) =>
        current.map((item) =>
          item.id === selectedCollectible.id ? { ...item, collected: true } : item
        )
      );
      setSelectedCollectible((current) =>
        current ? { ...current, collected: true } : current
      );
      setCollectStatus("Collected!");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not collect this item.";
      setCollectStatus(message);
    } finally {
      setCollecting(false);
    }
  }, [selectedCollectible, user, userLocation]);

  return (
    <div className="space-y-6 font-['Inter',system-ui,sans-serif]">
      {/* ── Search Bar ──────────────────────────────────────────────── */}
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
            <svg
              className="h-5 w-5 text-white drop-shadow-sm"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
              Explore Phuket
            </p>
            <p className="text-xs font-medium text-slate-600">
              {visiblePlaces.length} place
              {visiblePlaces.length !== 1 ? "s" : ""} found
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

      {/* ── Category Filters ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5">{categoryButtons}</div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
          {(["satellite", "street"] as const).map((style) => {
            const active = mapStyle === style;
            return (
              <button
                key={style}
                type="button"
                onClick={() => setMapStyle(style)}
                className={[
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                {style}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Map Container ───────────────────────────────────────────── */}
      <div
        className="overflow-hidden rounded-[32px] 
                    shadow-[0_30px_80px_rgba(15,23,42,0.10),0_10px_30px_rgba(15,23,42,0.06),-4px_-4px_16px_rgba(255,255,255,0.8)]
                    border border-slate-200/60 bg-white transition-all duration-300"
      >
        <div className="relative h-[540px] w-full min-h-[540px]">
          {loading && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/70 text-sm font-medium text-slate-600">
              Loading places…
            </div>
          )}
          {error && !loading && (
            <div className="pointer-events-none absolute left-4 right-4 top-4 z-20 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          {/* FIX #1: Use viewState (controlled) instead of initialViewState */}
          <Map
            ref={mapRef}
            reuseMaps
            mapStyle={mapStyle === "satellite" ? SATELLITE_STYLE : STREETS_STYLE}
            initialViewState={{
              latitude: DEFAULT_POSITION.latitude,
              longitude: DEFAULT_POSITION.longitude,
              zoom: DEFAULT_ZOOM,
            }}
            style={{ width: "100%", height: "100%" }}
            onLoad={handleMapLoad}
            attributionControl={false}
            scrollZoom
            dragPan
            doubleClickZoom
            touchZoomRotate
          >
            <NavigationControl position="top-right" />

            {/* User location marker */}
            {userLocation && (
              <Marker
                latitude={userLocation.latitude}
                longitude={userLocation.longitude}
                anchor="center"
              >
                <div
                  className="pointer-events-none relative flex h-7 w-7 items-center justify-center"
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

            {/* Place markers */}
            {visiblePlaces.map((place) => {
              const color =
                CATEGORY_COLORS[place.category] ?? CATEGORY_COLORS.other;
              const isSelected = selectedPlace?.id === place.id;

              return (
                <Marker
                  key={`place-${place.id}`}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedCollectible(null);
                    setCollectStatus(null);
                    setSelectedPlace(place);
                  }}
                >
                  {/* FIX #7: Added aria-label */}
                  <button
                    type="button"
                    aria-label={`${place.name} — ${CATEGORY_LABELS[place.category]}`}
                    className={[
                      "group relative flex cursor-pointer items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95",
                      isSelected ? "scale-125" : "",
                    ].join(" ")}
                    style={{
                      filter: `drop-shadow(0 8px 20px ${color}${isSelected ? "66" : "33"})`,
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

            {collectibles.map((item) => {
              const color = RARITY_COLORS[item.rarity];
              return (
                <Marker
                  key={`collectible-${item.id}`}
                  latitude={item.latitude}
                  longitude={item.longitude}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedPlace(null);
                    setCollectStatus(null);
                    setSelectedCollectible(item);
                  }}
                >
                  <button
                    type="button"
                    aria-label={item.name}
                    className="relative flex h-9 w-9 cursor-pointer items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
                    style={{ filter: `drop-shadow(0 0 12px ${color}88)` }}
                  >
                    <span
                      className="absolute inset-0 rounded-full opacity-70"
                      style={{
                        background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
                      }}
                    />
                    <span
                      className="relative h-5 w-5 rounded-full border-2 border-white"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, #fff 0%, ${color} 55%, ${color}cc 100%)`,
                        opacity: item.collected ? 0.45 : 1,
                      }}
                    />
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
                // FIX #4: Inline styles instead of undefined CSS class
                style={{
                  background: "transparent",
                  padding: "0",
                  boxShadow: "none",
                  border: "none",
                  borderRadius: "0",
                }}
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
                    >
                      <svg
                        className="h-4 w-4 text-white/90"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      {CATEGORY_LABELS[selectedPlace.category]}
                    </p>
                    {selectedPlace.is_promoted && (
                      <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Promoted
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2.5 text-base font-bold text-slate-900">
                    {selectedPlace.name}
                  </h3>
                  {selectedPlace.description ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                      {selectedPlace.description}
                    </p>
                  ) : null}
                </div>
              </Popup>
            )}

            {selectedCollectible && (
              <Popup
                latitude={selectedCollectible.latitude}
                longitude={selectedCollectible.longitude}
                anchor="bottom"
                offset={[0, -8]}
                closeOnClick={false}
                onClose={() => {
                  setSelectedCollectible(null);
                  setCollectStatus(null);
                }}
                maxWidth="300px"
                className="skeuo-popup"
              >
                <div
                  className="rounded-[20px] border border-emerald-100 bg-white p-4
                              shadow-[0_12px_40px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: RARITY_COLORS[selectedCollectible.rarity] }}
                  >
                    {RARITY_LABELS[selectedCollectible.rarity]} collectible
                  </p>
                  <h3 className="mt-1.5 text-base font-bold text-slate-900">{selectedCollectible.name}</h3>
                  {selectedCollectible.description ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                      {selectedCollectible.description}
                    </p>
                  ) : null}
                  {selectedCollectible.place_name ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Near {selectedCollectible.place_name}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-400">
                    +{selectedCollectible.xp_reward} XP · +{selectedCollectible.points_reward} pts ·{" "}
                    {selectedCollectible.catch_radius_meters}m range
                  </p>
                  {selectedCollectible.collected ? (
                    <p className="mt-3 text-sm font-semibold text-emerald-700">Already collected</p>
                  ) : (
                    <button
                      type="button"
                      disabled={collecting}
                      onClick={() => void handleCollect()}
                      className="mt-3 w-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(16,185,129,0.28)] disabled:opacity-60"
                    >
                      {collecting ? "Collecting…" : user ? "Collect" : "Log in to collect"}
                    </button>
                  )}
                  {collectStatus ? (
                    <p className="mt-2 text-xs leading-relaxed text-amber-800">{collectStatus}</p>
                  ) : null}
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>

      {/* ── Info Cards ──────────────────────────────────────────────── */}
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
              {/* FIX #3: h-[18px] w-[18px] instead of h-4.5 w-4.5 */}
              <svg
                className="h-[18px] w-[18px] text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                Destination
              </p>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                {selectedPlace?.name ?? selectedCollectible?.name ?? "Tap a marker to explore"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 pl-0.5">
            {selectedPlace?.description ||
              selectedCollectible?.description ||
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
              <svg
                className="h-[18px] w-[18px] text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                Map Style
              </p>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                {mapStyle === "satellite" ? "Satellite View" : "Street View"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 pl-0.5">
            Pins are places. Glowing orbs are collectibles. Pan, zoom, and tap markers for details.
          </p>
        </div>
      </div>
    </div>
  );
}