/* =========================================================
   APP CONFIG - every URL comes from environment variables so
   moving to your own domain is only an .env change.

   NEXT_PUBLIC_API_BASE_URL   backend API   e.g. https://api.yourdomain.com/api/v1
                              (or "/api/v1" when API_PROXY_TARGET is set - see next.config.mjs)
   NEXT_PUBLIC_DASHBOARD_URL  partner/admin panel  e.g. https://panel.yourdomain.com
   NEXT_PUBLIC_SITE_URL       this website         e.g. https://yourdomain.com
   NEXT_PUBLIC_DEFAULT_CITY   city used before the visitor picks one
========================================================= */

const trim = (value: string | undefined, fallback: string) => (value?.trim() || fallback).replace(/\/+$/, "");

export const API_BASE_URL = trim(process.env.NEXT_PUBLIC_API_BASE_URL, "http://localhost:5000/api/v1");
export const DASHBOARD_URL = trim(process.env.NEXT_PUBLIC_DASHBOARD_URL, "http://localhost:5173");
export const SITE_URL = trim(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000");
export const DEFAULT_CITY = process.env.NEXT_PUBLIC_DEFAULT_CITY?.trim() || "Karachi";

/* Origin of the backend (used for relative media URLs such as /uploads/...) */
export const API_ORIGIN = (() => {
  try {
    return API_BASE_URL.startsWith("http") ? new URL(API_BASE_URL).origin : "";
  } catch {
    return "";
  }
})();
