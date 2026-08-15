"use client";

import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";

export default function NavBar() {
  const { user, ready, logout } = useAuth();

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
              >
                Phuket Tourist App
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm sm:gap-6">
            <Link href="/" className="hidden text-gray-700 hover:text-emerald-700 hover:underline sm:inline">
              Home
            </Link>
            <Link href="/map" className="text-gray-700 hover:text-emerald-700 hover:underline">
              Map
            </Link>
            {ready && user ? (
              <>
                <span className="max-w-[8rem] truncate text-slate-700" title={user.username}>
                  {user.username}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
