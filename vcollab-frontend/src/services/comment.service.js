import api from "../lib/axios";

export async function listComments(params) {
  const response = await api.get("/comments", { params });
  return response.data.data;
}

export async function createComment(payload) {
  const response = await api.post("/comments", payload);
  return response.data.data;
}

export async function updateComment(id, payload) {
  const response = await api.put(`/comments/${id}`, payload);
  return response.data.data;
}

export async function deleteComment(id) {
  const response = await api.delete(`/comments/${id}`);
  return response.data.data;
}
