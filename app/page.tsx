import MapSection from "./components/MapSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="bg-gradient-to-b from-blue-50 to-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="flex flex-col gap-6">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700">
                Phuket Tourist App
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Geoapify places explorer
              </p>
              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                Explore Phuket with an interactive map
              </h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                Search for places (cafes, restaurants, attractions, shopping, etc.), then click markers or results to zoom in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">1) Search</p>
                <p className="mt-1 text-sm text-gray-600">Type a place keyword and pick a category.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">2) Tap markers</p>
                <p className="mt-1 text-sm text-gray-600">Click a marker to preview details.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">3) Focus</p>
                <p className="mt-1 text-sm text-gray-600">Select a result list item to center the map.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">How it works</h2>
              <p className="mt-1 text-sm text-gray-600">
                Search within Phuket and then select a result to focus the map.
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">Fast filters</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Category dropdown limits results for quicker discovery.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">Marker details</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Click markers or result cards to preview and center.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden lg:sticky lg:top-20">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Map</h2>
              <p className="mt-1 text-sm text-gray-600">Interactive Phuket map (Geoapify + Leaflet)</p>
            </div>
            <div className="p-4 sm:p-6">
              <MapSection />
            </div>
          </aside>
        </div>

        <footer className="mt-6 pb-6 text-xs text-gray-500">
          Powered by Geoapify tiles & Places API (requires an API key via NEXT_PUBLIC_GEOAPIFY_API_KEY).
        </footer>
      </div>
    </main>
  );
}

