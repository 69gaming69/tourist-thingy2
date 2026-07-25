"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef, ViewState } from "react-map-gl/maplibre";

type PlaceCategory = "attraction" | "food" | "stay" | "shopping" | "beach";

interface PlaceResult {
  place_id: string;
  name: string;
  lat: number;
  lon: number;
  category: PlaceCategory;
  description: string;
}

const DEFAULT_POSITION: { latitude: number; longitude: number } = { latitude: 7.8804, longitude: 98.3923 };
const DEFAULT_ZOOM = 12;

const PLACE_CARDS: PlaceResult[] = [
  {
    place_id: "phuket_old_town",
    name: "Phuket Old Town",
    lat: 7.8940,
    lon: 98.3925,
    category: "attraction",
    description: "Colorful streets, cafes, and street art in historical Phuket.",
  },
  {
    place_id: "patong_beach",
    name: "Patong Beach",
    lat: 7.8960,
    lon: 98.2984,
    category: "beach",
    description: "Lively sand, blue water, and a beautiful free beach boardwalk.",
  },
  {
    place_id: "big_buddha",
    name: "Big Buddha Phuket",
    lat: 7.8278,
    lon: 98.3124,
    category: "attraction",
    description: "A serene hilltop landmark with panoramic island views.",
  },
  {
    place_id: "chalong_bay_hotel",
    name: "Chalong Bay Hotel",
    lat: 7.8339,
    lon: 98.3434,
    category: "stay",
    description: "Calm stay near Chalong pier and island tours.",
  },
  {
    place_id: "local_cafe",
    name: "Rustic Coffee Bar",
    lat: 7.8831,
    lon: 98.3849,
    category: "food",
    description: "A cozy spot for strong coffee and local pastries.",
  },
  {
    place_id: "central_patong",
    name: "Central Phuket Mall",
    lat: 7.9009,
    lon: 98.2972,
    category: "shopping",
    description: "Modern mall with boutiques, dining, and a textured skylight.",
  },
];

const CATEGORY_LABELS: Record<PlaceCategory | "all", string> = {
  all: "All",
  attraction: "Attraction",
  food: "Food",
  stay: "Stay",
  shopping: "Shopping",
  beach: "Beach",
};

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  attraction: "#7c3aed",
  food: "#f97316",
  stay: "#0ea5e9",
  shopping: "#10b981",
  beach: "#38bdf8",
};

// ESRI World Imagery satellite style for MapLibre
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

export default function GeoapifyMap() {
  const mapRef = useRef<MapRef | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(PLACE_CARDS[0] ?? null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    latitude: DEFAULT_POSITION.latitude,
    longitude: DEFAULT_POSITION.longitude,
    zoom: DEFAULT_ZOOM,
  });
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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

  // Fly to selected place when it changes
  useEffect(() => {
    if (!mapRef.current || !selectedPlace) return;
    mapRef.current.flyTo({
      center: [selectedPlace.lon, selectedPlace.lat],
      zoom: DEFAULT_ZOOM,
      duration: 1000,
    });
  }, [selectedPlace?.place_id]);

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return PLACE_CARDS.filter((place) => {
      const matchesCategory = category === "all" || place.category === category;
      const matchesSearch =
        !query ||
        place.name.toLowerCase().includes(query) ||
        place.description.toLowerCase().includes(query) ||
        CATEGORY_LABELS[place.category].toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, category]);

  const visiblePlaces = filteredPlaces.length > 0 ? filteredPlaces : PLACE_CARDS;

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, []);

  return (
    <div className="space-y-6 font-['Inter',system-ui,sans-serif]">
      {/* Search Card — Skeuomorphic */}
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
              Search attractions, beaches, food &amp; more
            </p>
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search food, beach, stay, or attraction"
            className="w-full rounded-2xl border border-slate-200/80 bg-[#edf7ed] px-5 py-3.5 text-sm 
                       text-slate-900 outline-none transition duration-200 
                       shadow-[inset_0_2px_6px_rgba(15,23,42,0.06)]
                       placeholder:text-slate-400
                       focus:border-emerald-300 focus:shadow-[inset_0_2px_6px_rgba(16,185,129,0.12),0_0_0_3px_rgba(16,185,129,0.12)]"
          />
        </div>
      </div>

      {/* Category Pills — Skeuomorphic buttons */}
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

      {/* Map Container — Skeuomorphic raised panel */}
      <div
        className="overflow-hidden rounded-[32px] 
                    shadow-[0_30px_80px_rgba(15,23,42,0.10),0_10px_30px_rgba(15,23,42,0.06),-4px_-4px_16px_rgba(255,255,255,0.8)]
                    border border-slate-200/60 bg-white transition-all duration-300"
      >
        <div className="relative h-[540px] w-full">
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
            {/* Custom Navigation Control — Skeuomorphic */}
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

            {/* User Location Marker */}
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
                  {/* Pulse ring */}
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
                  {/* Core dot */}
                  <div
                    className="relative z-10 h-5 w-5 rounded-full border-[3px] border-white 
                                bg-gradient-to-br from-emerald-400 to-emerald-600 
                                shadow-[0_4px_12px_rgba(16,185,129,0.4)]"
                  />
                </div>
              </Marker>
            )}

            {/* Place Markers */}
            {visiblePlaces.map((place) => {
              const color = CATEGORY_COLORS[place.category];
              return (
                <Marker
                  key={place.place_id}
                  latitude={place.lat}
                  longitude={place.lon}
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
                    {/* Marker body */}
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
                    {/* Tiny stem shadow */}
                    <div className="absolute -bottom-1.5 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-slate-900/10" />
                  </button>
                </Marker>
              );
            })}

            {/* Popup for selected place */}
            {selectedPlace && (
              <Popup
                latitude={selectedPlace.lat}
                longitude={selectedPlace.lon}
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
                    >
                      {selectedPlace.category === "attraction" && (
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l9 7-3 12H6L3 9l9-7z" /></svg>
                      )}
                      {selectedPlace.category === "beach" && (
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a5 5 0 00-5-5H9a5 5 0 00-5 5v2" /></svg>
                      )}
                      {selectedPlace.category === "food" && (
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m0 0l-3-3m3 3l3-3M4 4l16 16" /></svg>
                      )}
                      {selectedPlace.category === "stay" && (
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" /></svg>
                      )}
                      {selectedPlace.category === "shopping" && (
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      )}
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      {CATEGORY_LABELS[selectedPlace.category]}
                    </p>
                  </div>
                  <h3 className="mt-2.5 text-base font-bold text-slate-900">{selectedPlace.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{selectedPlace.description}</p>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>

      {/* Bottom Info Cards — Skeuomorphic */}
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
            {selectedPlace?.description ?? "Pick a point on the satellite map to reveal the next Phuket destination."}
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

