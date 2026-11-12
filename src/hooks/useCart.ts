"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorCode, getErrorMessage } from "@/services/api";
import { cartApi } from "@/services/foodmart";
import { useAuthStore } from "@/store/authStore";
import type { CartView } from "@/lib/types";
import { useRequireAuth } from "./useRequireAuth";
import { OWN_PROFILE_MESSAGE, useManagedProfileIds } from "./useOwnership";

/* =========================================================
   CART (server side - one seller per cart)
========================================================= */

export const CART_KEY = ["cart"];

export function useCart() {
  const user = useAuthStore((s) => s.user);
  return useQuery({ queryKey: CART_KEY, queryFn: cartApi.get, enabled: Boolean(user) });
}

export const cartCount = (cart?: CartView | null) => (cart?.items || []).reduce((n, i) => n + i.quantity, 0);

export function useAddToCart() {
  const qc = useQueryClient();
  const ensureAuth = useRequireAuth();
  const managed = useManagedProfileIds();
  const mutation = useMutation({
    mutationFn: ({ foodId, quantity = 1, replaceCart = false }: { foodId: string; quantity?: number; replaceCart?: boolean; name?: string }) => cartApi.add(foodId, quantity, replaceCart),
    onSuccess: (cart, vars) => {
      qc.setQueryData(CART_KEY, cart);
      toast.success(`${vars.name || "Item"} added to cart`, { action: { label: "View cart", onClick: () => (window.location.href = "/cart") } });
    },
    onError: (error, vars) => {
      if (getErrorCode(error) === "OWN_PROFILE") {
        toast.info(OWN_PROFILE_MESSAGE);
        return;
      }
      if (getErrorCode(error) === "CART_SELLER_CONFLICT") {
        toast("Your cart has items from another restaurant", {
          description: "Start a new cart with this item?",
          action: { label: "Start new cart", onClick: () => mutation.mutate({ ...vars, replaceCart: true }) },
        });
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
  return {
    ...mutation,
    /* sellerId (optional) lets the UI explain right away when the food belongs to the user's own profile */
    add: (foodId: string, name?: string, quantity = 1, sellerId?: string) => {
      if (!ensureAuth("Sign in to order food")) return false;
      if (sellerId && managed.has(String(sellerId))) {
        toast.info(OWN_PROFILE_MESSAGE);
        return false;
      }
      mutation.mutate({ foodId, name, quantity });
      return true;
    },
    /* Same as add() but resolves true when the item really is in the cart (for "Order now") */
    addAndWait: async (foodId: string, name?: string, quantity = 1, sellerId?: string) => {
      if (!ensureAuth("Sign in to order food")) return false;
      if (sellerId && managed.has(String(sellerId))) {
        toast.info(OWN_PROFILE_MESSAGE);
        return false;
      }
      try {
        await mutation.mutateAsync({ foodId, name, quantity });
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function useUpdateCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ foodId, quantity }: { foodId: string; quantity: number }) => (quantity <= 0 ? cartApi.remove(foodId) : cartApi.update(foodId, quantity)),
    onSuccess: (cart) => qc.setQueryData(CART_KEY, cart),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
