import { del, get, getPaged, patch, post, put, upload } from "./api";
import type { Address, CartView, Cursor, Deal, Food, FoodCategory, MealSlot, MyProfile, Notification, Order, Post, Profile, Recommendation, Review, User } from "@/lib/types";

/* =========================================================
   FOODMART STOREFRONT API (backend /api/v1)
   One object per area. All responses are already unwrapped
   from the { success, message, data } envelope.
========================================================= */

export interface AuthPayload {
  accessToken?: string;
  refreshToken?: string;
  user: User;
  profiles: MyProfile[];
  requiresEmailVerification?: boolean;
  message?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  cuisines?: string[];
  profileType?: "BUYER" | "RESTAURANT" | "CHEF" | "LOCAL_POINT" | "BLOGGER";
  profileDisplayName?: string;
}

/* ---------- auth & account ---------- */
export const authApi = {
  login: (email: string, password: string) => post<AuthPayload>("/auth/login", { email, password }),
  register: (input: RegisterInput) => post<AuthPayload>("/auth/register", input),
  logout: (refreshToken?: string | null) => post("/auth/logout", { refreshToken }),
  forgotPassword: (email: string) => post("/auth/password/forgot", { email }),
  resetPassword: (token: string, password: string) => post("/auth/password/reset", { token, password }),
  verifyEmail: (token: string) => post("/auth/email/verify", { token }),
  resendVerification: (email: string) => post("/auth/email/resend", { email }),
  changePassword: (currentPassword: string, newPassword: string) => post("/auth/password/change", { currentPassword, newPassword }),
};

export const accountApi = {
  me: () => get<{ user: User; preferences: any; profiles: MyProfile[] }>("/users/me"),
  update: (body: Partial<Pick<User, "name" | "phone">>) => patch<User>("/users/me", body),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return upload<User>("/users/me/avatar", form);
  },
  preferences: () => get<any>("/users/me/preferences"),
  updatePreferences: (body: Record<string, unknown>) => patch<any>("/users/me/preferences", body),
  addresses: () => get<Address[]>("/users/me/addresses"),
  addAddress: (body: Partial<Address>) => post<Address>("/users/me/addresses", body),
  updateAddress: (id: string, body: Partial<Address>) => patch<Address>(`/users/me/addresses/${id}`, body),
  removeAddress: (id: string) => del(`/users/me/addresses/${id}`),
  savedPosts: () => get<Cursor<{ savedAt: string; post: Post }>>("/users/me/saved-posts"),
  favoriteFoods: (mealSlot?: string) => get<Cursor<{ favoritedAt: string; mealSlots?: MealSlot[]; food: Food }>>("/users/me/favorite-foods", mealSlot ? { mealSlot } : {}),
  following: () => get<Cursor<{ profile: Profile; followedAt: string }>>("/users/me/following"),
  myReviews: () => getPaged<Review>("/users/me/reviews"),
};

/* ---------- catalog & discovery ---------- */
export const catalogApi = {
  categories: () => get<FoodCategory[]>("/food-categories"),
  foods: (params: Record<string, unknown>) => getPaged<Food>("/foods", params),
  food: (id: string) => get<Food & { seller: Profile; activeDeals: Deal[]; viewer: { isFavorite: boolean; mealSlots?: MealSlot[]; isMember: boolean } }>(`/foods/${id}`),
  similar: (id: string) => get<Food[]>(`/foods/${id}/similar`),
  profileFoods: (id: string) => get<Food[]>(`/profiles/${id}/foods`),
  profileDeals: (profileId: string) => get<Deal[]>(`/profiles/${profileId}/deals`),
  deals: (params: Record<string, unknown> = {}) => get<(Deal & { profile: Profile; foods: Food[] })[]>("/deals", params, { timeout: 15000 }),
};

export const discoveryApi = {
  search: (q: string, type = "all", limit = 12) => get<{ query: string; foods?: Food[]; profiles?: Profile[]; posts?: Post[] }>("/search", { q, type, limit }),
  nearby: (params: Record<string, unknown>) => get<{ centre: any; radiusKm: number; items: any[] }>("/discovery/nearby", params),
  trending: (params: Record<string, unknown> = {}) => get<{ foods: Food[]; hashtags: { tag: string; posts: number }[]; posts: Post[] }>("/discover/trending", params),
  cities: (q?: string) => get<{ results: { city: string; region?: string; latitude: number; longitude: number }[] }>("/locations/geocode", { q }),
  profiles: (params: Record<string, unknown>) => getPaged<Profile>("/profiles", params),
  featured: () => get<Profile[]>("/profiles/featured"),
  profile: (idOrSlug: string) => get<Profile & { viewer?: { isFollowing: boolean; membershipRole: string | null } }>(`/profiles/${idOrSlug}`),
  awards: (params: Record<string, unknown> = {}) => getPaged<any>("/awards/winners", params),
  config: () => get<Record<string, unknown>>("/platform/config"),
};

/* ---------- social ---------- */
export const socialApi = {
  feed: (params: Record<string, unknown> = {}) => get<Cursor<Post> & { scope?: string }>("/feed", params),
  reels: (params: Record<string, unknown> = {}) => get<Cursor<Post>>("/reels/feed", params),
  post: (id: string) => get<Post>(`/posts/${id}`),
  profilePosts: (id: string, params: Record<string, unknown> = {}) => get<Cursor<Post>>(`/profiles/${id}/posts`, params),
  like: (id: string, on: boolean) => (on ? put(`/posts/${id}/like`) : del(`/posts/${id}/like`)),
  save: (id: string, on: boolean) => (on ? put(`/posts/${id}/save`) : del(`/posts/${id}/save`)),
  favorite: (foodId: string, on: boolean) => (on ? put(`/foods/${foodId}/favorite`) : del(`/foods/${foodId}/favorite`)),
  addFavorite: (foodId: string) => put<{ favorite: boolean; mealSlots?: MealSlot[] }>(`/foods/${foodId}/favorite`),
  /* save (or change) the meals a favourite dish is for */
  favoriteMeals: (foodId: string, mealSlots: string[]) => put<{ favorite: boolean; mealSlots: MealSlot[] }>(`/foods/${foodId}/favorite`, { mealSlots }),
  follow: (profileId: string, on: boolean) => (on ? put(`/profiles/${profileId}/follow`) : del(`/profiles/${profileId}/follow`)),
  view: (id: string, watchedSeconds: number) => post(`/posts/${id}/view`, { watchedSeconds }),
  share: (id: string) => post(`/posts/${id}/share`),
  comments: (id: string, parentId?: string) => get<Cursor<any>>(`/posts/${id}/comments`, { parentId, limit: 30 }),
  comment: (id: string, body: string, parentId?: string) => post<any>(`/posts/${id}/comments`, { body, parentId }),
};

/* ---------- cart & orders ---------- */
export const cartApi = {
  get: () => get<CartView>("/cart"),
  add: (foodId: string, quantity = 1, replaceCart = false) => put<CartView>("/cart/items", { foodId, quantity, replaceCart }),
  update: (foodId: string, quantity: number) => patch<CartView>(`/cart/items/${foodId}`, { quantity }),
  remove: (foodId: string) => del<CartView>(`/cart/items/${foodId}`),
  clear: () => del<CartView>("/cart"),
};

export const orderApi = {
  checkout: (body: Record<string, unknown>, idempotencyKey: string) => post<Order>("/orders", body, { headers: { "Idempotency-Key": idempotencyKey } }),
  list: (params: Record<string, unknown> = {}) => getPaged<Order>("/orders", params),
  get: (id: string) => get<Order & { viewerRole?: string }>(`/orders/${id}`),
  cancel: (id: string, reason?: string) => post<Order>(`/orders/${id}/cancel`, { reason }),
};

export const reviewApi = {
  foodReviews: (foodId: string, params: Record<string, unknown> = {}) => getPaged<Review>(`/foods/${foodId}/reviews`, params),
  profileReviews: (profileId: string, params: Record<string, unknown> = {}) => getPaged<Review>(`/profiles/${profileId}/reviews`, params),
  createFood: (body: Record<string, unknown>) => post<Review>("/food-reviews", body),
  createService: (type: "RESTAURANT" | "SELLER", body: Record<string, unknown>) => post<Review>(type === "RESTAURANT" ? "/restaurant-reviews" : "/seller-reviews", body),
};

export const recommendationApi = {
  list: (mode: "FOR_YOU" | "TRY_NEW" = "FOR_YOU", limit = 10) => get<{ mode: string; items: Recommendation[] }>("/recommendations", { mode, limit }),
  feedback: (id: string, feedback: "LIKE" | "NOT_INTERESTED") => post(`/recommendations/${id}/feedback`, { feedback }),
  click: (id: string) => post(`/recommendations/${id}/click`),
};

export const notificationApi = {
  list: () => get<Cursor<Notification> & { unreadCount?: number }>("/notifications"),
  unread: () => get<{ unreadCount: number }>("/notifications/unread-count"),
  markAllRead: () => post("/notifications/read-all"),
  mealSettings: () => get<MealSettings>("/notification-preferences/meals"),
  saveMealSettings: (body: { mealAlerts?: boolean; times?: Record<string, { enabled?: boolean; time?: string }> }) => patch<MealSettings>("/notification-preferences/meals", body),
  testMeal: (slot: string) => post<{ sent: boolean; count?: number; reason?: string }>("/notification-preferences/meals/test", { slot }),
};

export interface MealSettings {
  foodAlerts: boolean;
  mealAlerts: boolean;
  times: Record<MealSlot, { enabled: boolean; time: string }>;
  defaults: Record<MealSlot, string>;
  slots: MealSlot[];
  timeZone: string;
}

/* ---------- payments ---------- */
export interface PaymentMethodInfo {
  method: "CASH_ON_DELIVERY" | "CASH_ON_PICKUP" | "JAZZCASH" | "EASYPAISA" | "CARD";
  available: boolean;
  kind: "CASH" | "CARD" | "WALLET";
  reason?: string;
}

export interface OrderPayment {
  _id: string;
  method: PaymentMethodInfo["method"];
  status: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  amount: number;
  currency: string;
  paidAt?: string;
  expiresAt?: string;
  failureReason?: string;
  proof?: { status: "NONE" | "SUBMITTED" | "ACCEPTED" | "REJECTED"; reference?: string; rejectReason?: string };
  refundStatus?: string;
  refundAmount?: number;
  walletDestination?: { number: string; accountTitle: string; owner: string } | null;
}

export const paymentApi = {
  methods: (sellerId?: string) => get<PaymentMethodInfo[]>("/payments/methods", { sellerId }),
  forOrder: (orderId: string) => get<OrderPayment>(`/orders/${orderId}/payment`),
  startCard: (orderId: string) => post<{ provider: string; url: string; expiresAt?: string }>(`/orders/${orderId}/payment/session`, {}),
  syncCard: (orderId: string) => post<{ status: string; paidAt?: string }>(`/orders/${orderId}/payment/sync`, {}),
  submitProof: (orderId: string, body: { reference: string; senderName?: string; senderPhone?: string; note?: string }) => post<OrderPayment>(`/orders/${orderId}/payment/proof`, body),
};

/* ---------- AI assistant ---------- */
export const agentApi = {
  status: () => get<{ enabled: boolean; provider: string; dailyLimit: number; used: number; remaining: number; note: string }>("/agents/status"),
  chat: (body: { message: string; conversationId?: string; language?: "en" | "ur" }) =>
    post<{ conversationId: string; reply: string; provider: string; suggestions: any; usage: { used: number; limit: number; remaining: number } }>("/agents/chat", body),
};
