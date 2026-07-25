import MapSection from "./components/MapSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#d1e8d1] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[36px] border border-emerald-200 bg-[#eaf5ea] p-8 shadow-[16px_16px_48px_rgba(15,23,42,0.08),-8px_-8px_24px_rgba(255,255,255,0.95)] backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 shadow-[inset_2px_2px_6px_rgba(15,23,42,0.08)]">
            Phuket Tourist App
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            OpenLibre-style map
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                A soft, skeuomorphic Phuket map experience with free tiles.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Explore Phuket locations with a polished tactile interface, free OpenStreetMap tiles, and no API key required.
              </p>
            </div>

            <div className="rounded-[28px] border border-emerald-200 bg-[#dceddc] p-5 shadow-[inset_5px_5px_16px_rgba(15,23,42,0.06),inset_-5px_-5px_16px_rgba(255,255,255,0.9)]">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">No key, no limits</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Uses free OSM tile layers and built-in location search, so the entire app stays lightweight and beautiful.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="rounded-[36px] border border-emerald-200 bg-[#eaf5ea] p-8 shadow-[16px_16px_48px_rgba(15,23,42,0.08),-8px_-8px_24px_rgba(255,255,255,0.95)]">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[inset_4px_4px_16px_rgba(15,23,42,0.06),inset_-4px_-4px_16px_rgba(255,255,255,0.95)]">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">1. Browse</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Search local Phuket spots instantly with built-in filters and smooth marker interactions.
                </p>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[inset_4px_4px_16px_rgba(15,23,42,0.06),inset_-4px_-4px_16px_rgba(255,255,255,0.95)]">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">2. Tap</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Click any marker for details, then watch the map focus softly on that destination.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[32px] border border-emerald-200 bg-[#dceddc] p-6 shadow-[inset_4px_4px_20px_rgba(15,23,42,0.08),inset_-4px_-4px_20px_rgba(255,255,255,0.95)]">
              <h2 className="text-xl font-semibold text-slate-900">Why OpenLibre-style works</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The app blends soft extruded surfaces with subtle shadows and gentle gradients for a premium, tactile feel. Every panel feels like a physical control board you can touch.
              </p>
            </div>
          </section>

          <aside className="rounded-[36px] border border-emerald-200 bg-[#eaf5ea] p-6 shadow-[16px_16px_48px_rgba(15,23,42,0.08),-8px_-8px_24px_rgba(255,255,255,0.95)] lg:sticky lg:top-7">
            <div className="rounded-[32px] border border-emerald-200 bg-[#f0faf0] p-4 shadow-[inset_4px_4px_16px_rgba(15,23,42,0.06),inset_-4px_-4px_16px_rgba(255,255,255,0.95)]">
              <h2 className="text-xl font-bold text-slate-950">Live map</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Free OpenStreetMap tiles, custom Phuket markers, and a soft UI that feels premium.
              </p>
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[10px_10px_30px_rgba(15,23,42,0.08),-6px_-6px_18px_rgba(255,255,255,0.95)]">
              <MapSection />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

