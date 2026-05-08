const normalizeApiBaseUrl = (value) => {
  const trimmed = (value || "").trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "";
  }

  // Support older env values like ".../api" by upgrading to ".../api/v1".
  if (trimmed.endsWith("/api")) {
    return `${trimmed}/v1`;
  }

  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }

  return `${trimmed}/api/v1`;
};

const getDefaultApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return "http://localhost:3000/api/v1";
  }

  if (typeof window === "undefined") {
    return "http://localhost:3000/api/v1";
  }
  return `${window.location.origin}/api/v1`;
};

const getDefaultWsBaseUrl = () => {
  if (typeof window === "undefined") {
    return "ws://localhost:3000/ws";
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_NEXT_API_URL || import.meta.env.VITE_API_URL || getDefaultApiBaseUrl()
);

export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL || getDefaultWsBaseUrl();

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const roles = {
  SUPER_ADMIN: "SUPER_ADMIN",
  STUDENT: "STUDENT",
  INDUSTRIAL_EXPERT: "INDUSTRIAL_EXPERT",
  SOFTWARE_ENGINEER: "SOFTWARE_ENGINEER"
};
