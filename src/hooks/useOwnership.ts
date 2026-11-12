"use client";

import { useAuthStore } from "@/store/authStore";

/* Profiles (restaurant / chef / food point / blogger) the signed-in user manages.
   A manager cannot follow, order from or review their own profile, so the UI
   hides those actions and points to the dashboard instead. */
export function useManagedProfileIds() {
  const profiles = useAuthStore((s) => s.profiles);
  return new Set(profiles.map((p) => String(p.profile._id)));
}

export function useIsMine(profileId?: string | null) {
  const ids = useManagedProfileIds();
  return Boolean(profileId && ids.has(String(profileId)));
}

/* id of a profile given as an id string or a populated object */
export const idOf = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return (value as { _id?: string })._id;
};

export const OWN_PROFILE_MESSAGE = "This is your own business profile. To test ordering, sign in with a separate customer account.";
