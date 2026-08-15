import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
              P
            </div>
            <div className="leading-tight">
              <Link
                href="/"
                className="text-black text-sm sm:text-base font-semibold hover:underline"
              > Phuket Tourist App
               
              </Link>
              <p className="text-xs text-gray-500">Geoapify places explorer</p>
            </div>
          </div>
                                              
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <Link href="/" className="text-gray-700 hover:text-emerald-700 hover:underline">
              Home
            </Link>
            <Link
              href="/map"
              className="text-gray-700 hover:text-emerald-700 hover:underline"
            >
              Map
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

