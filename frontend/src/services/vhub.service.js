import api from "../lib/axios";

export async function getVHubSettings() {
  const response = await api.get("/v-hub/settings");
  return response.data.data;
}

export async function listVHubThreads(params) {
  const response = await api.get("/v-hub/threads", { params });
  return response.data.data;
}

export async function getVHubThread(id) {
  const response = await api.get(`/v-hub/threads/${id}`);
  return response.data.data;
}

export async function listVHubReplies(threadId, params) {
  const response = await api.get(`/v-hub/threads/${threadId}/replies`, { params });
  return response.data.data;
}

export async function createVHubThread(payload) {
  const response = await api.post("/v-hub/threads", payload);
  return response.data.data;
}

export async function createVHubReply(threadId, payload) {
  const response = await api.post(`/v-hub/threads/${threadId}/replies`, payload);
  return response.data.data;
}

export async function solveVHubThread(id, payload) {
  const response = await api.patch(`/v-hub/threads/${id}/solve`, payload);
  return response.data.data;
}

export async function reopenVHubThread(id) {
  const response = await api.patch(`/v-hub/threads/${id}/reopen`);
  return response.data.data;
}

export async function deleteVHubThread(id) {
  const response = await api.delete(`/v-hub/threads/${id}`);
  return response.data.data;
}

export async function deleteVHubReply(id) {
  const response = await api.delete(`/v-hub/threads/replies/${id}`);
  return response.data.data;
}

export async function getAdminVHubSettings() {
  const response = await api.get("/admin/v-hub/settings");
  return response.data.data;
}

export async function updateAdminVHubSettings(payload) {
  const response = await api.patch("/admin/v-hub/settings", payload);
  return response.data.data;
}

export async function listAdminVHubThreads(params) {
  const response = await api.get("/admin/v-hub/threads", { params });
  return response.data.data;
}

export async function getAdminVHubSummary() {
  const response = await api.get("/admin/v-hub/summary");
  return response.data.data;
}

export async function lockAdminVHubThread(id, payload) {
  const response = await api.patch(`/admin/v-hub/threads/${id}/lock`, payload);
  return response.data.data;
}

export async function hideAdminVHubThread(id, payload) {
  const response = await api.patch(`/admin/v-hub/threads/${id}/hide`, payload);
  return response.data.data;
}

export async function hideAdminVHubReply(id, payload) {
  const response = await api.patch(`/admin/v-hub/replies/${id}/hide`, payload);
  return response.data.data;
}
