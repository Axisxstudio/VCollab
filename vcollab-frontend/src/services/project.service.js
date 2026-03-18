import api from "../lib/axios";

export async function listProjects(params) {
  const response = await api.get("/projects", { params });
  return response.data.data;
}

export async function listUserProjects(username, params) {
  const response = await api.get(`/projects/user/${username}`, { params });
  return response.data.data;
}

export async function getProject(id) {
  const response = await api.get(`/projects/${id}`);
  return response.data.data;
}

export async function createProject(payload) {
  const response = await api.post("/projects", payload);
  return response.data.data;
}

export async function updateProject(id, payload) {
  const response = await api.put(`/projects/${id}`, payload);
  return response.data.data;
}

export async function deleteProject(id) {
  const response = await api.delete(`/projects/${id}`);
  return response.data.data;
}
