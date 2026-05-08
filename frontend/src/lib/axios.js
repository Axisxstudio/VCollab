import axios from "axios";
import { API_BASE_URL } from "../config/constants";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: API_BASE_URL
});

function isLikelyJwt(token) {
  if (typeof token !== "string") {
    return false;
  }

  const trimmed = token.trim();
  // Guard against corrupted persisted values that can overflow request headers.
  if (!trimmed || trimmed.length > 2048) {
    return false;
  }

  const parts = trimmed.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (isLikelyJwt(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

export default api;
