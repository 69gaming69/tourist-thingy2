import MapSection from "@/app/components/MapSection";
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

type TodoItem = {
  id: number;
  name: string;
};

export default async function Page() {
  // const cookieStore = await cookies();
  // const supabase = await createClient(cookieStore);

  // const { data: todos } = await supabase.from('todos').select('id, name');

  return (
    <main className="min-h-screen bg-[#d1e8d1] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-[36px] border border-emerald-200 bg-[#eaf5ea] p-6 shadow-[16px_16px_48px_rgba(15,23,42,0.08),-8px_-8px_24px_rgba(255,255,255,0.95)]">
          <h1 className="text-3xl font-bold text-slate-950">Phuket map data</h1>
          <p className="mt-2 text-sm text-slate-600">This page shows your Supabase todos list.</p>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[inset_4px_4px_14px_rgba(15,23,42,0.06),inset_-4px_-4px_14px_rgba(255,255,255,0.95)]">
            {/* <ul className="space-y-2">
              {todos?.map((todo) => (
                <li
                  key={todo.id}
                  className="rounded-2xl border border-slate-200 bg-[#f8fbff] px-4 py-3 text-slate-900"
                >
                  {todo.name}
                </li>
              ))}
            </ul> */}
          </div>
        </section>

        <section className="mt-8 rounded-[36px] border border-slate-200 bg-white p-4 shadow-[10px_10px_30px_rgba(15,23,42,0.08),-6px_-6px_18px_rgba(255,255,255,0.95)]">
          <MapSection />
        </section>
      </div>
    </main>
  );
}

export function Home() {
  return (
    <main className="min-h-screen">
      <div className="p-6 max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Phuket map</h1>
          <p className="text-gray-600 mt-2">
            Search places using Geoapify&apos;s Places API, then click markers or items to focus.
          </p>
        </header>

        <section className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white p-4">
          <MapSection />
        </section>
      </div>
    </main>
  );
}