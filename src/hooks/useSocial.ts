"use client";

import { useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/services/api";
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
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return { on, toggle, busy, setOn };
}

export const useFollow = (profileId: string, initial = false) =>
  useToggle(initial, (on) => socialApi.follow(profileId, on), { on: "Following", off: "Unfollowed", auth: "Sign in to follow" });

export const useFavorite = (foodId: string, initial = false) =>
  useToggle(initial, (on) => socialApi.favorite(foodId, on), { on: "Saved to favourites", off: "Removed from favourites", auth: "Sign in to save favourites" });

export const useLike = (postId: string, initial = false) => useToggle(initial, (on) => socialApi.like(postId, on), { on: "", off: "", auth: "Sign in to like posts" });

export const useSavePost = (postId: string, initial = false) =>
  useToggle(initial, (on) => socialApi.save(postId, on), { on: "Saved", off: "Removed from saved", auth: "Sign in to save posts" });
