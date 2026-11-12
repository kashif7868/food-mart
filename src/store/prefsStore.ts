"use client";

import { create } from "zustand";

/* =========================================================
   PREFERENCES: language (English / Urdu) and colour theme.
   Saved in localStorage and applied on <html> (class "dark",
   lang, dir). layout.tsx runs the same logic before first paint
   so there is no flash.
========================================================= */

export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

export const LANG_KEY = "fm_lang";
export const THEME_KEY = "fm_theme";

const safeGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
};

export const applyPrefs = (lang: Lang, theme: Theme) => {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === "ur" ? "rtl" : "ltr";
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("lang-ur", lang === "ur");
  root.style.colorScheme = theme;
};

interface PrefsState {
  lang: Lang;
  theme: Theme;
  hydrated: boolean;
  hydrate: () => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const usePrefs = create<PrefsState>((set, get) => ({
  lang: "en",
  theme: "light",
  hydrated: false,
  hydrate: () => {
    const lang: Lang = safeGet(LANG_KEY) === "ur" ? "ur" : "en";
    const stored = safeGet(THEME_KEY);
    const theme: Theme = stored === "dark" || stored === "light" ? stored : window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyPrefs(lang, theme);
    set({ lang, theme, hydrated: true });
  },
  setLang: (lang) => {
    safeSet(LANG_KEY, lang);
    applyPrefs(lang, get().theme);
    set({ lang });
  },
  setTheme: (theme) => {
    safeSet(THEME_KEY, theme);
    applyPrefs(get().lang, theme);
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));
