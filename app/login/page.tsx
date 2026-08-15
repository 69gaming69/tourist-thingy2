"use client";

import { FormEvent, FocusEvent, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "@/app/components/AuthProvider";

gsap.registerPlugin(useGSAP);

const LoginBackground = dynamic(() => import("./LoginBackground"), { ssr: false });

type RuleId = "length" | "upper" | "lower" | "number" | "special";

const RULES: { id: RuleId; label: string; test: (value: string) => boolean }[] = [
  { id: "length", label: "At least 8 characters", test: (value) => value.length >= 8 },
  { id: "upper", label: "One capital letter (A–Z)", test: (value) => /[A-Z]/.test(value) },
  { id: "lower", label: "One lowercase letter (a–z)", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "One number (0–9)", test: (value) => /\d/.test(value) },
  { id: "special", label: "One special character (!@#$…)", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  show,
  onToggle,
  required,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  show: boolean;
  onToggle: () => void;
  required?: boolean;
  onFocus?: () => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <span className="relative mt-1.5 block">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={autoComplete}
          required={required}
          className="skeuo-input w-full rounded-2xl px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          className="skeuo-eye absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <EyeIcon open={show} />
        </button>
      </span>
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, register, continueAsGuest } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const checks = useMemo(
    () => RULES.map((rule) => ({ ...rule, ok: rule.test(password) })),
    [password]
  );
  const passed = checks.filter((rule) => rule.ok).length;
  const strength = passed / RULES.length;
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const canRegister = passed === RULES.length && passwordsMatch && username.trim().length >= 2;

  useGSAP(
    () => {
      gsap.from(cardRef.current, {
        y: 36,
        duration: 0.7,
        ease: "power3.out",
      });
    },
    { scope: cardRef }
  );

  useGSAP(
    () => {
      if (!barRef.current) return;
      gsap.to(barRef.current, {
        scaleX: strength,
        duration: 0.35,
        ease: "power2.out",
      });
    },
    { dependencies: [strength, passwordFocused], scope: cardRef }
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "register") {
      if (!canRegister) {
        setError("Meet every password rule and confirm it matches.");
        return;
      }
    }

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

  const strengthLabel =
    passed <= 1 ? "Weak" : passed <= 3 ? "Fair" : passed === 4 ? "Strong" : "Excellent";

  const showStrength = mode === "register" && passwordFocused;

  const strengthPanel = (
    <div
      ref={panelRef}
      className="skeuo-panel w-72 rounded-3xl p-4"
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>Password strength</span>
        <span>{strengthLabel}</span>
      </div>
      <div className="skeuo-track mt-2 h-3 overflow-hidden rounded-full">
        <div
          ref={barRef}
          className="h-full origin-left rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500"
          style={{ transform: `scaleX(${strength})` }}
        />
      </div>
      <ul className="mt-3 space-y-2">
        {checks.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2.5 text-xs text-slate-700">
            <span className={`skeuo-check ${rule.ok ? "is-on" : ""}`} aria-hidden>
              {rule.ok ? (
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : null}
            </span>
            <span className={rule.ok ? "font-medium text-emerald-800" : ""}>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-x-clip px-4 py-10 text-slate-900">
      <LoginBackground />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center lg:pr-4">
        <div
          ref={cardRef}
          className="skeuo-card relative z-10 w-full max-w-md rounded-[36px] bg-[#eaf5ea] p-8 sm:p-10"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-800/70">
            Phuket Tourist App
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {mode === "login"
              ? "Sign in to save check-ins and collectibles. Guests can still explore the map."
              : "Pick a username and a solid password. You’ll use this to collect items on the map."}
          </p>

          <div className="skeuo-toggle mt-6 grid grid-cols-2 gap-2 rounded-full p-1.5">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setPasswordFocused(false);
              }}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                mode === "login" ? "skeuo-toggle-active text-white" : "text-slate-600"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                mode === "register" ? "skeuo-toggle-active text-white" : "text-slate-600"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                className="skeuo-input mt-1.5 w-full rounded-2xl px-4 py-3.5 text-sm text-slate-900 outline-none"
              />
            </label>

            <div className="relative">
              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                show={showPassword}
                onToggle={() => setShowPassword((open) => !open)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={(event) => {
                  const next = event.relatedTarget as Node | null;
                  if (panelRef.current?.contains(next)) return;
                  setPasswordFocused(false);
                }}
                required
              />
              {showStrength ? (
                <div className="mt-3 lg:absolute lg:left-full lg:top-6 lg:z-20 lg:mt-0 lg:ml-4">
                  {strengthPanel}
                </div>
              ) : null}
            </div>

            {mode === "register" && (
              <>
                <PasswordField
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  show={showConfirm}
                  onToggle={() => setShowConfirm((open) => !open)}
                  required
                />
                {confirmPassword.length > 0 && (
                  <p className={`text-xs font-medium ${passwordsMatch ? "text-emerald-700" : "text-rose-600"}`}>
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </>
            )}

            {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

            <button type="submit" disabled={pending} className="skeuo-primary w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGuest}
            disabled={pending}
            className="skeuo-secondary mt-4 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 disabled:opacity-60"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </main>
  );
}
