import api from "../lib/axios";

export async function shareContent(contentType, contentId) {
  const response = await api.post("/shares", { contentType, contentId });
  return response.data.data;
}
