export const API_URL =
  typeof window === "undefined" ? (process.env.API_INTERNAL_URL ?? "http://localhost:4000/api/v1") : "/api/v1";
export const DEFAULT_CITY = "Kota, Rajasthan";
export const DELIVERY_ETA_MIN = 10;
export const DEALS_TITLE = "Festive Specials";
export const CATALOG_REVALIDATE_S = 60;
export const ONBOARDED_COOKIE = "onboarded";
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || null;
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || null;
