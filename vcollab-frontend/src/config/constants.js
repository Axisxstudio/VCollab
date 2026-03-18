const getDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "http://localhost:8080/api/v1";
  }
  return `${window.location.origin}/api/v1`;
};

const getDefaultWsBaseUrl = () => {
  if (typeof window === "undefined") {
    return "ws://localhost:8080/ws";
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
};

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || getDefaultApiBaseUrl();

export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL || getDefaultWsBaseUrl();

export const roles = {
  SUPER_ADMIN: "SUPER_ADMIN",
  STUDENT: "STUDENT",
  INDUSTRIAL_EXPERT: "INDUSTRIAL_EXPERT",
  SOFTWARE_ENGINEER: "SOFTWARE_ENGINEER"
};
