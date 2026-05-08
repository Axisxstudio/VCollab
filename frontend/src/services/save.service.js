import api from "../lib/axios";

export async function saveContent(contentType, contentId) {
  const response = await api.post("/saves", { contentType, contentId });
  return response.data.data;
}

export async function unsaveContent(contentType, contentId) {
  const response = await api.delete("/saves", { params: { contentType, contentId } });
  return response.data.data;
}

export async function getSaveStatus(contentType, contentId) {
  const response = await api.get("/saves/status", { params: { contentType, contentId } });
  return response.data.data;
}

export async function listSavedContent() {
  const response = await api.get("/saves/me");
  return response.data.data;
}
