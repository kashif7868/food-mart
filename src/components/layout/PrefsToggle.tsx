"use client";

import { useEffect, useRef, useState } from "react";
import { LuCheck, LuChevronDown, LuGlobe, LuMoon, LuSun } from "react-icons/lu";

import { cn } from "@/lib/utils";
import { usePrefs } from "@/store/prefsStore";

/* Language (English / اردو) and dark-theme switches */

export function ThemeButton({ className }: { className?: string }) {
  const theme = usePrefs((s) => s.theme);
  const toggle = usePrefs((s) => s.toggleTheme);
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn("flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition hover:bg-ink-50", className)}
    >
      {dark ? <LuSun className="text-[21px]" /> : <LuMoon className="text-[21px]" />}
    </button>
  );
}

const LANGS = [
  { code: "en", label: "English", native: "English" },
  { code: "ur", label: "Urdu", native: "اردو" },
] as const;

/* Globe icon button that opens a small menu to pick the language */
export function LanguageButton({ className }: { className?: string; showLabel?: boolean }) {
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Choose language"
        title="Language / زبان"
        className="flex h-10 items-center gap-1 rounded-full px-2.5 text-ink-800 transition hover:bg-ink-50"
      >
        <LuGlobe className="text-[21px]" />
        <span className="hidden text-[13px] font-semibold sm:inline">{lang === "ur" ? "اردو" : "EN"}</span>
        <LuChevronDown className={cn("hidden text-sm transition sm:block", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-[70] mt-2 w-44 overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-xl">
          <p className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">Language</p>
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={cn("flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-start text-sm transition hover:bg-ink-50", lang === l.code ? "font-bold text-brand-600" : "text-ink-800")}
            >
              <span lang={l.code}>{l.native}</span>
              {lang === l.code ? <LuCheck className="text-base" /> : <span className="text-xs text-ink-400">{l.label}</span>}
            </button>
          ))}
        </div>
      )}
      <span className="sr-only">{current.label}</span>
    </div>
  );
}

/* Full-width segmented control used in the mobile drawer */
export function PrefsPanel() {
  const lang = usePrefs((s) => s.lang);
  const theme = usePrefs((s) => s.theme);
  const setLang = usePrefs((s) => s.setLang);
  const setTheme = usePrefs((s) => s.setTheme);
  const seg = (active: boolean) => cn("flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition", active ? "brand-gradient text-white shadow-glow" : "text-ink-600");
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold text-ink-500">Language</p>
        <div className="flex gap-1 rounded-xl bg-ink-100 p-1">
          <button type="button" onClick={() => setLang("en")} className={seg(lang === "en")}>
            English
          </button>
          <button type="button" onClick={() => setLang("ur")} className={seg(lang === "ur")}>
            اردو
          </button>
        </div>
      </div>
      <div className="flex gap-1 rounded-xl bg-ink-100 p-1">
        <button type="button" onClick={() => setTheme("light")} className={cn(seg(theme === "light"), "flex items-center justify-center gap-1.5")}>
          <LuSun /> Light
        </button>
        <button type="button" onClick={() => setTheme("dark")} className={cn(seg(theme === "dark"), "flex items-center justify-center gap-1.5")}>
          <LuMoon /> Dark
        </button>
      </div>
    </div>
  );
}
