import api from "../lib/axios";

export async function searchPublicProfiles(params) {
  const response = await api.get("/users/discover", { params });
  return response.data.data;
}

export async function getPublicProfile(username) {
  const response = await api.get(`/users/${username}`);
  return response.data.data;
}

export async function getMyProfile() {
  const response = await api.get("/users/me/profile");
  return response.data.data;
}

export async function updateMyProfile(payload) {
  const response = await api.patch("/users/me/profile", payload);
  return response.data.data;
}

export async function updateProfileImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/users/me/profile-image", formData);
  return response.data.data;
}

export async function updateCoverImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/users/me/cover-image", formData);
  return response.data.data;
}

// ─── Tag Suggestions ────────────────────────────────────────────────────────
export async function fetchTagSuggestions(q) {
  const response = await api.get("/tags/suggest", { params: { q } });
  return response.data.data || [];
}

// ─── Content Targeting ─────────────────────────────────────────────────────
export async function upsertContentTargeting(payload) {
  const response = await api.put("/targeting", payload);
  return response.data.data;
}

export async function getContentTargeting(contentId, contentType) {
  const response = await api.get("/targeting", { params: { contentId, contentType } });
  return response.data.data;
}
