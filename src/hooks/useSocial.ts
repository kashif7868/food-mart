"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { MealSlot } from "@/lib/types";
import { getErrorCode, getErrorMessage } from "@/services/api";
import { socialApi } from "@/services/foodmart";
import { useRequireAuth } from "./useRequireAuth";

/* =========================================================
   Optimistic toggles: like / save a post, favourite a food,
   follow a profile. State starts from the API's viewer fields.
========================================================= */

function useToggle(initial: boolean, call: (on: boolean) => Promise<unknown>, messages: { on: string; off: string; auth: string }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const ensureAuth = useRequireAuth();
  const toggle = async () => {
    if (!ensureAuth(messages.auth) || busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      await call(next);
      if (messages.on || messages.off) toast.success(next ? messages.on : messages.off);
    } catch (error) {
      setOn(!next);
      if (getErrorCode(error) === "OWN_PROFILE") toast.info("This is your own profile, so you cannot follow it.");
      else toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return { on, toggle, busy, setOn };
}

export const useFollow = (profileId: string, initial = false) =>
  useToggle(initial, (on) => socialApi.follow(profileId, on), { on: "Following", off: "Unfollowed", auth: "Sign in to follow" });

/* Favourite a dish. Saving opens a small "which meal?" picker; the dish is already saved, the picker only files it under breakfast / lunch / dinner... */
export function useFavorite(foodId: string, initial = false, initialSlots: MealSlot[] = []) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState<MealSlot[]>(initialSlots);
  const [pickerOpen, setPickerOpen] = useState(false);
  const ensureAuth = useRequireAuth();

  const toggle = async () => {
    if (!ensureAuth("Sign in to save favourites") || busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      if (next) {
        /* no meals sent: the server starts from the dish's own meal tags */
        const saved = await socialApi.addFavorite(foodId);
        setSlots(saved?.mealSlots || []);
        toast.success("Saved to favourites");
        setPickerOpen(true);
      } else {
        await socialApi.favorite(foodId, false);
        setSlots([]);
        setPickerOpen(false);
        toast.success("Removed from favourites");
      }
    } catch (error) {
      setOn(!next);
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const saveSlots = async (next: MealSlot[]) => {
    try {
      const res = await socialApi.favoriteMeals(foodId, next);
      setSlots(res?.mealSlots ?? next);
      toast.success(next.length ? "Meals saved" : "Saved without a meal");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  return { on, toggle, busy, setOn, slots, pickerOpen, openPicker: () => setPickerOpen(true), closePicker: () => setPickerOpen(false), saveSlots };
}

export const useLike = (postId: string, initial = false) => useToggle(initial, (on) => socialApi.like(postId, on), { on: "", off: "", auth: "Sign in to like posts" });

export const useSavePost = (postId: string, initial = false) =>
  useToggle(initial, (on) => socialApi.save(postId, on), { on: "Saved", off: "Removed from saved", auth: "Sign in to save posts" });
