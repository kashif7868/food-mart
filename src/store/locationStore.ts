"use client";

import { create } from "zustand";

import { DEFAULT_CITY } from "@/lib/config";

/* =========================================================
   LOCATION STORE
   The city shown in the header ("Karachi, Pakistan"). Used for
   nearby food points, trending restaurants and offers.
   Optional GPS coordinates when the visitor allows it.
========================================================= */

const KEY = "fm_city";

export const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Gujranwala",
  "Sialkot",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
];

interface LocationState {
  city: string;
  coords: { lat: number; lng: number } | null;
  hydrate: () => void;
  setCity: (city: string) => void;
  locate: () => Promise<boolean>;
}

export const useLocationStore = create<LocationState>((set) => ({
  city: DEFAULT_CITY,
  coords: null,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(KEY);
    if (saved) set({ city: saved });
  },
  setCity: (city) => {
    if (typeof window !== "undefined") localStorage.setItem(KEY, city);
    set({ city, coords: null });
  },
  locate: () =>
    new Promise<boolean>((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(false);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          set({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
          resolve(true);
        },
        () => resolve(false),
        { timeout: 8000 }
      );
    }),
}));

/* Query params for location-aware endpoints */
export const locationParams = (state: Pick<LocationState, "city" | "coords">) =>
  state.coords ? { lat: state.coords.lat, lng: state.coords.lng } : { city: state.city };
