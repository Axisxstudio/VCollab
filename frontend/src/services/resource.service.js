import api from "../lib/axios";

function normalizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}

function appendJsonPart(formData, name, value) {
  formData.append(name, new Blob([JSON.stringify(value)], { type: "application/json" }));
}

export async function getResourcesOverview() {
  const response = await api.get("/resources/public/overview");
  return response.data.data;
}

export async function listResourceCategories() {
  const response = await api.get("/resources/public/categories");
  return response.data.data;
}

export async function listResourceInstitutions() {
  const response = await api.get("/resources/public/institutions");
  return response.data.data;
}

export async function listResourceYears(institutionId) {
  const response = await api.get(`/resources/public/institutions/${institutionId}/years`);
  return response.data.data;
}

export async function listResourceSemesters(yearId) {
  const response = await api.get(`/resources/public/years/${yearId}/semesters`);
  return response.data.data;
}

export async function explorePublicResources(folderId) {
  const response = await api.get("/resources/public/explorer", {
    params: normalizeParams({ folderId })
  });
  return response.data.data;
}

export async function searchPublicResources(params) {
  const response = await api.get("/resources/public/search", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function previewPublicResourceFile(id) {
  const response = await api.get(`/resources/public/files/${id}/preview`);
  return response.data.data;
}

export async function downloadPublicResourceFile(id) {
  const response = await api.get(`/resources/public/files/${id}/download`);
  return response.data.data;
}

export async function getMyResourceDashboard() {
  const response = await api.get("/resources/mine/dashboard");
  return response.data.data;
}

export async function getMyResourceExplorer(folderId) {
  const response = await api.get("/resources/mine/explorer", {
    params: normalizeParams({ folderId })
  });
  return response.data.data;
}

export async function ensureResourcePath(payload) {
  const response = await api.post("/resources/folders/ensure-path", payload);
  return response.data.data;
}

export async function createResourceFolder(payload) {
  const response = await api.post("/resources/folders", payload);
  return response.data.data;
}

export async function updateResourceFolder(id, payload) {
  const response = await api.patch(`/resources/folders/${id}`, payload);
  return response.data.data;
}

export async function deleteResourceFolder(id) {
  const response = await api.delete(`/resources/folders/${id}`);
  return response.data.data;
}

export async function uploadResourceFiles(payload, files) {
  const formData = new FormData();
  appendJsonPart(formData, "request", payload);
  files.forEach((file) => formData.append("files", file));

  const response = await api.post("/resources/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data;
}

export async function updateResourceFile(id, payload) {
  const response = await api.patch(`/resources/files/${id}`, payload);
  return response.data.data;
}

export async function replaceResourceFile(id, payload, file) {
  const formData = new FormData();
  if (payload) {
    appendJsonPart(formData, "request", payload);
  }
  formData.append("file", file);

  const response = await api.put(`/resources/files/${id}/replace`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data;
}

export async function deleteResourceFile(id) {
  const response = await api.delete(`/resources/files/${id}`);
  return response.data.data;
}

export async function listAdminResources(params) {
  const response = await api.get("/admin/resources", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function updateAdminResourceModeration(id, payload) {
  const response = await api.patch(`/admin/resources/${id}/moderation`, payload);
  return response.data.data;
}

export async function deleteAdminResource(id) {
  const response = await api.delete(`/admin/resources/${id}`);
  return response.data.data;
}

export async function restoreAdminResource(id) {
  const response = await api.patch(`/admin/resources/${id}/restore`);
  return response.data.data;
}

export async function listAdminResourceStructure(type, parentId) {
  const response = await api.get("/admin/resources/structure", {
    params: normalizeParams({ type, parentId })
  });
  return response.data.data;
}

export async function createAdminResourceStructure(payload) {
  const response = await api.post("/admin/resources/structure", payload);
  return response.data.data;
}

export async function updateAdminResourceStructure(id, payload) {
  const response = await api.patch(`/admin/resources/structure/${id}`, payload);
  return response.data.data;
}

export async function listAdminResourceCategories() {
  const response = await api.get("/admin/resources/categories");
  return response.data.data;
}

export async function createAdminResourceCategory(payload) {
  const response = await api.post("/admin/resources/categories", payload);
  return response.data.data;
}

export async function updateAdminResourceCategory(id, payload) {
  const response = await api.patch(`/admin/resources/categories/${id}`, payload);
  return response.data.data;
}
