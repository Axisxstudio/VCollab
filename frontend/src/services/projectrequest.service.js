import api from "../lib/axios";

export async function createProjectRequest(payload) {
  const response = await api.post("/project-requests", payload);
  return response.data.data;
}

export async function listSentProjectRequests() {
  const response = await api.get("/project-requests/sent");
  return response.data.data;
}

export async function listReceivedProjectRequests() {
  const response = await api.get("/project-requests/received");
  return response.data.data;
}

export async function updateProjectRequestStatus(id, status) {
  const response = await api.patch(`/project-requests/${id}/status`, { status });
  return response.data.data;
}
