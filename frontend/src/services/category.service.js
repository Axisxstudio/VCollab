import api from "../lib/axios";

export async function listCategories(type) {
  const response = await api.get("/categories", {
    params: type ? { type } : undefined
  });
  return response.data.data;
}

export async function createCategory(payload) {
  const response = await api.post("/categories", payload);
  return response.data.data;
}
