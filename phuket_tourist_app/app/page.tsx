//npm install leaflet react-leaflet
//npm install -D @types/leaflet
// app/page.tsx
"use client"; // Required for next/dynamic with ssr:false in App Router

import dynamic from "next/dynamic";

// Dynamically import the map component, disabling Server-Side Rendering
const GeoapifyMap = dynamic(() => import("@/app/components/GeoapifyMap"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default function Home() {
  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Next.js Geoapify Map</h1>
      
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <GeoapifyMap />
      </div>
    </main>
  );
}
