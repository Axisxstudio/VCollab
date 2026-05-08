import api from "../lib/axios";

export async function listConversations(params) {
  const response = await api.get("/conversations", { params });
  return response.data.data;
}

export async function createConversation(userId) {
  const response = await api.post("/conversations", { userId });
  return response.data.data;
}

export async function getConversation(id) {
  const response = await api.get(`/conversations/${id}`);
  return response.data.data;
}

export async function markConversationRead(id) {
  const response = await api.patch(`/conversations/${id}/read`);
  return response.data.data;
}
