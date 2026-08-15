"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      router.push("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  async function handleGuest() {
    setError(null);
    setPending(true);
    try {
      await continueAsGuest();
      router.push("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue as guest.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#d1e8d1] px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-md rounded-[32px] border border-emerald-200 bg-[#eaf5ea] p-8 shadow-[16px_16px_48px_rgba(15,23,42,0.08),-8px_-8px_24px_rgba(255,255,255,0.95)]">
        <h1 className="text-2xl font-bold text-slate-950">
          {mode === "login" ? "Log in" : "Create an account"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to save your identity for later. You can also continue as a guest.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              mode === "login" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              mode === "register" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Please wait…" : mode === "login" ? "Log in" : "Register"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGuest}
          disabled={pending}
          className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:opacity-60"
        >
          Continue as guest
        </button>
      </div>
    </main>
  );
}
