import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* Merge Tailwind classes safely */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/* 1250 -> "Rs. 1,250" */
export const formatPKR = (value: number | null | undefined, { compact = false } = {}) => {
  const amount = Number(value || 0);
  if (compact && Math.abs(amount) >= 1000) {
    return `Rs. ${formatCompact(amount)}`;
  }
  return `Rs. ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
};

/* 8900 -> "8.9K", 1200000 -> "1.2M" */
export const formatCompact = (value: number | null | undefined) => {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString("en-PK");
};

export const formatPercent = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined || Number.isNaN(value) ? "-" : `${(value * 100).toFixed(digits)}%`;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/* "Today, 2:30 PM" / "Yesterday, 9:10 AM" / "12 Oct, 4:00 PM" */
export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  const now = new Date();
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (sameDay(date, now)) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
};

export const formatDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-";

/* "2 mins ago" */
export const timeAgo = (value?: string | Date | null) => {
  if (!value) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const units: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "min"],
  ];
  for (const [size, label] of units) {
    const amount = Math.floor(seconds / size);
    if (amount >= 1) return `${amount} ${label}${amount > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FM";

export const titleCase = (value = "") =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/* Public URL of a profile: /restaurants/burger-lab, /chefs/..., /food-points/..., /bloggers/... */
const PROFILE_BASE: Record<string, string> = {
  RESTAURANT: "restaurants",
  CHEF: "chefs",
  LOCAL_POINT: "food-points",
  BLOGGER: "bloggers",
  BUYER: "explore",
};
export const profilePath = (profile?: { slug?: string; _id?: string; profileType?: string } | null) =>
  profile ? `/${PROFILE_BASE[profile.profileType || "RESTAURANT"] || "restaurants"}/${profile.slug || profile._id}` : "/explore";

export const PROFILE_TYPE_LABEL: Record<string, string> = {
  RESTAURANT: "Restaurant",
  CHEF: "Home Chef",
  LOCAL_POINT: "Food Point",
  BLOGGER: "Food Blogger",
  BUYER: "Foodie",
};

/* Best rating to show for a profile (restaurant > seller > food) */
export const profileRating = (profile?: { ratings?: Record<string, { average: number; count: number }> } | null) => {
  const r = profile?.ratings;
  if (!r) return { average: 0, count: 0 };
  return [r.restaurant, r.seller, r.food].find((x) => x?.count) || { average: 0, count: 0 };
};

export const cuisineLine = (cuisines?: string[], max = 2) =>
  (cuisines || []).slice(0, max).map((c) => titleCase(c)).join(" • ");

export const distanceLabel = (km?: number | null) => (km === undefined || km === null ? "" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

export const durationLabel = (seconds?: number | null) => (seconds ? `${Math.round(seconds)}s` : "");

/* Percentage change between two numbers, null when not computable */
export const percentChange = (current: number, previous: number) => {
  if (!previous) return current > 0 ? 1 : null;
  return (current - previous) / previous;
};

/* Last N calendar days as YYYY-MM-DD (Asia/Karachi friendly local dates) */
export const lastDays = (count: number) => {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return days;
};

export const shortDayLabel = (isoDate: string) => {
  const d = new Date(`${isoDate}T00:00:00`);
  return String(d.getDate());
};

export const primaryImage = (media?: { url: string; isPrimary?: boolean }[] | null) =>
  (media?.find((m) => m.isPrimary) || media?.[0])?.url || null;

export const truncate = (value = "", length = 80) => (value.length > length ? `${value.slice(0, length - 1)}…` : value);
