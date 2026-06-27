"use client";

import GeoapifyMap from "./components/GeoapifyMap";


export default function Home() {
  return (
    <main className="min-h-screen">

      <div className="p-6 max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Geoapify Places (Phuket)</h1>
          <p className="text-gray-600 mt-2">
            Search places using Geoapify’s Places API, then click markers or items to focus.
          </p>
        </header>

        <section className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
          <GeoapifyMap />
        </section>
      </div>
    </main>
  );
}

    