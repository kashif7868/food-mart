"use client";

import { create } from "zustand";

import { setAuthFailureHandler, tokenStore } from "@/services/api";
import { accountApi, authApi, type AuthPayload, type RegisterInput } from "@/services/foodmart";
import type { MyProfile, User } from "@/lib/types";

/* =========================================================
   AUTH STORE
   - Tokens live in localStorage (services/api tokenStore)
   - initialize() restores the session with GET /users/me
   - Business profiles (restaurant / chef / food point / blogger)
     are managed in the FoodMart dashboard.
========================================================= */

interface AuthState {
  user: User | null;
  profiles: MyProfile[];
  ready: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthPayload>;
  register: (input: RegisterInput) => Promise<AuthPayload>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const apply = (payload: AuthPayload) => {
    if (payload.accessToken) tokenStore.set(payload.accessToken, payload.refreshToken);
    if (payload.accessToken) set({ user: payload.user, profiles: payload.profiles || [] });
    return payload;
  };

  return {
    user: null,
    profiles: [],
    ready: false,

    initialize: async () => {
      setAuthFailureHandler(() => set({ user: null, profiles: [] }));
      if (!tokenStore.access && !tokenStore.refresh) {
        set({ ready: true });
        return;
      }
      try {
        const me = await accountApi.me();
        set({ user: me.user, profiles: me.profiles || [], ready: true });
      } catch {
        tokenStore.clear();
        set({ user: null, profiles: [], ready: true });
      }
    },

    refresh: async () => {
      if (!get().user) return;
      const me = await accountApi.me();
      set({ user: me.user, profiles: me.profiles || [] });
    },

    login: async (email, password) => apply(await authApi.login(email, password)),

    register: async (input) => apply(await authApi.register(input)),

    logout: async () => {
      try {
        await authApi.logout(tokenStore.refresh);
      } catch {
        /* ignore network errors on logout */
      }
      tokenStore.clear();
      set({ user: null, profiles: [] });
    },

    setUser: (user) => set({ user }),
  };
});

/* Business profiles the user can manage in the dashboard */
export const partnerProfiles = (profiles: MyProfile[]) => profiles.filter((m) => m.profile.profileType !== "BUYER");
