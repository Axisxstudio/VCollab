import api from "../lib/axios";

export async function likeContent(contentType, contentId) {
  const response = await api.post("/likes", { contentType, contentId });
  return response.data.data;
}

export async function unlikeContent(contentType, contentId) {
  const response = await api.delete("/likes", { params: { contentType, contentId } });
  return response.data.data;
}

export async function getLikeStatus(contentType, contentId) {
  const response = await api.get("/likes/status", { params: { contentType, contentId } });
  return response.data.data;
}
