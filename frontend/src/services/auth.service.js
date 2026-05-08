import api from "../lib/axios";

export async function login(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data.data;
}

export async function register(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data.data;
}

export async function fetchMe() {
  const response = await api.get("/auth/me");
  return response.data.data;
}

export async function requestPasswordReset(payload) {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data.data;
}

export async function resetPassword(payload) {
  const response = await api.post("/auth/reset-password", payload);
  return response.data.data;
}

export async function checkUsernameAvailability(username) {
  const response = await api.get(`/auth/check-username?username=${username}`);
  return response.data.data;
}
