import api from "../lib/axios";

export async function searchWorkspace(params) {
  const response = await api.get("/search", { params });
  return response.data.data;
}
