import api from "../lib/axios";

export async function getHomeFeed(params) {
  const response = await api.get("/feed", { params });
  return response.data.data;
}
