import MapSection from "@/app/components/MapSection";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#d1e8d1] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-[36px] border border-emerald-200 bg-[#eaf5ea] p-6 shadow-[16px_16px_48px_rgba(15,23,42,0.08),-8px_-8px_24px_rgba(255,255,255,0.95)]">
          <h1 className="text-3xl font-bold text-slate-950">Phuket map</h1>
          <p className="mt-2 text-sm text-slate-600">
            Browse live places from the API. Login is optional.
          </p>
        </section>

        <section className="mt-8 rounded-[36px] border border-slate-200 bg-white p-4 shadow-[10px_10px_30px_rgba(15,23,42,0.08),-6px_-6px_18px_rgba(255,255,255,0.95)]">
          <MapSection />
        </section>
      </div>
    </main>
  );
}
