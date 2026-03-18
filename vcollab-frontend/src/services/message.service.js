import api from "../lib/axios";

export async function listMessages(conversationId, params) {
  const response = await api.get(`/messages/conversations/${conversationId}`, { params });
  return response.data.data;
}

export async function sendMessage(payload) {
  const response = await api.post("/messages", payload);
  return response.data.data;
}

export async function deleteMessage(id) {
  const response = await api.delete(`/messages/${id}`);
  return response.data.data;
}
