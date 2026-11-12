import { API_BASE_URL } from "@/lib/config";
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

/* =========================================================
   FOODMART API CLIENT
   - Base URL from NEXT_PUBLIC_API_BASE_URL (default http://localhost:5000/api/v1)
   - Runs in the browser only (tokens live in localStorage); every
     data-fetching component is a client component.
   - Bearer access token on every request
   - On 401 the refresh token is rotated once (single flight) and the
     request is retried; if refresh fails the user is logged out.
   - Backend success shape: { success, message, data, meta? }
========================================================= */



export { API_BASE_URL };

if (typeof window !== "undefined" && window.location.hostname !== "localhost" && /localhost|127\.0\.0\.1/.test(API_BASE_URL)) {
  console.warn(`[FoodMart] NEXT_PUBLIC_API_BASE_URL points to ${API_BASE_URL}. Set it to your live API URL in the hosting environment variables and redeploy.`);
}

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const ACCESS_KEY = "fm_access_token";
const REFRESH_KEY = "fm_refresh_token";

export const tokenStore = {
  get access() {
    return isBrowser() ? localStorage.getItem(ACCESS_KEY) : null;
  },
  get refresh() {
    return isBrowser() ? localStorage.getItem(REFRESH_KEY) : null;
  },
  set(access: string, refresh?: string) {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

/* Session id used by the backend to de-duplicate reel views for analytics */
const sessionId = () => {
  if (!isBrowser()) return "";
  const key = "fm_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(key, id);
  }
  return id;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  const sid = sessionId();
  if (sid) config.headers.set("X-Session-Id", sid);
  return config;
});

/* ---------- refresh handling ---------- */

let refreshPromise: Promise<string | null> | null = null;
let onAuthFailure: (() => void) | null = null;

export const setAuthFailureHandler = (handler: () => void) => {
  onAuthFailure = handler;
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
    const payload = data?.data || {};
    if (!payload.accessToken) return null;
    tokenStore.set(payload.accessToken, payload.refreshToken);
    return payload.accessToken as string;
  } catch {
    return null;
  }
};

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const isAuthRoute = original?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshPromise = refreshPromise || refreshAccessToken().finally(() => (refreshPromise = null));
      const token = await refreshPromise;
      if (token) {
        original.headers.set("Authorization", `Bearer ${token}`);
        return api(original);
      }
      tokenStore.clear();
      onAuthFailure?.();
    }
    return Promise.reject(error);
  }
);

/* ---------- helpers ---------- */

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, any>;
}

export const getErrorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") => {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Cannot reach the FoodMart server. Is the backend running? Check NEXT_PUBLIC_API_BASE_URL.";
    const body = error.response.data as { message?: string; details?: { field?: string; message: string }[] };
    if (body?.details?.length && Array.isArray(body.details)) {
      return body.details.map((d) => (d.field ? `${d.field}: ${d.message}` : d.message)).join(" · ");
    }
    return body?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

export const getErrorCode = (error: unknown): string | undefined =>
  axios.isAxiosError(error) ? (error.response?.data as { code?: string })?.code : undefined;

/* Remove empty params so URLs stay clean */
const clean = (params?: Record<string, unknown>) =>
  params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")) : undefined;

export async function get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<ApiEnvelope<T>>(url, { ...config, params: clean(params) });
  return data.data;
}

/* For list endpoints that return { data: [...], meta: {...} } */
export async function getPaged<T>(url: string, params?: Record<string, unknown>) {
  const { data } = await api.get<ApiEnvelope<T[]>>(url, { params: clean(params) });
  return { items: data.data || [], meta: data.meta as { page: number; limit: number; total: number; totalPages: number; [k: string]: any } | undefined };
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.post<ApiEnvelope<T>>(url, body, config);
  return data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<ApiEnvelope<T>>(url, body);
  return data.data;
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<ApiEnvelope<T>>(url, body);
  return data.data;
}

export async function del<T = null>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.delete<ApiEnvelope<T>>(url, body ? { data: body } : undefined);
  return data.data;
}

/* Multipart upload helper */
export async function upload<T>(url: string, form: FormData): Promise<T> {
  const { data } = await api.post<ApiEnvelope<T>>(url, form, { headers: { "Content-Type": "multipart/form-data" } });
  return data.data;
}
