import api from "../lib/axios";

function normalizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}

function extractFilename(disposition, fallback) {
  if (!disposition) {
    return fallback;
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const quotedMatch = disposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const simpleMatch = disposition.match(/filename=([^;]+)/i);
  if (simpleMatch?.[1]) {
    return simpleMatch[1].trim();
  }

  return fallback;
}

export async function getAdminDashboardSummary() {
  const response = await api.get("/admin/dashboard/summary");
  return response.data.data;
}

export async function listAdminUsers(params) {
  const response = await api.get("/admin/users", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function updateAdminUserStatus(id, payload) {
  const response = await api.patch(`/admin/users/${id}/status`, payload);
  return response.data.data;
}

export async function deleteAdminUser(id) {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data.data;
}

export async function listAdminReports(params) {
  const response = await api.get("/admin/reports", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function updateAdminReportStatus(id, payload) {
  const response = await api.patch(`/admin/reports/${id}`, payload);
  return response.data.data;
}

export async function deleteAdminReport(id) {
  const response = await api.delete(`/admin/reports/${id}`);
  return response.data.data;
}

export async function listAdminWarnings(params) {
  const response = await api.get("/admin/warnings", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function createAdminWarning(payload) {
  const response = await api.post("/admin/warnings", payload);
  return response.data.data;
}

export async function deleteAdminWarning(id) {
  const response = await api.delete(`/admin/warnings/${id}`);
  return response.data.data;
}

export async function listAdminCmsBlocks(params) {
  const response = await api.get("/admin/cms-blocks", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function createAdminCmsBlock(payload) {
  const response = await api.post("/admin/cms-blocks", payload);
  return response.data.data;
}

export async function updateAdminCmsBlock(id, payload) {
  const response = await api.patch(`/admin/cms-blocks/${id}`, payload);
  return response.data.data;
}

export async function listAdminProjects(params) {
  const response = await api.get("/admin/projects", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function updateAdminProjectModeration(id, payload) {
  const response = await api.patch(`/admin/projects/${id}/moderation`, payload);
  return response.data.data;
}

export async function deleteAdminProject(id) {
  const response = await api.delete(`/admin/projects/${id}`);
  return response.data.data;
}

export async function restoreAdminProject(id) {
  const response = await api.patch(`/admin/projects/${id}/restore`);
  return response.data.data;
}

export async function listAdminPosts(params) {
  const response = await api.get("/admin/posts", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function updateAdminPostModeration(id, payload) {
  const response = await api.patch(`/admin/posts/${id}/moderation`, payload);
  return response.data.data;
}

export async function deleteAdminPost(id) {
  const response = await api.delete(`/admin/posts/${id}`);
  return response.data.data;
}

export async function restoreAdminPost(id) {
  const response = await api.patch(`/admin/posts/${id}/restore`);
  return response.data.data;
}

export async function listAdminBlogs(params) {
  const response = await api.get("/admin/blogs", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function updateAdminBlogModeration(id, payload) {
  const response = await api.patch(`/admin/blogs/${id}/moderation`, payload);
  return response.data.data;
}

export async function deleteAdminBlog(id) {
  const response = await api.delete(`/admin/blogs/${id}`);
  return response.data.data;
}

export async function restoreAdminBlog(id) {
  const response = await api.patch(`/admin/blogs/${id}/restore`);
  return response.data.data;
}

export async function listAllCategories() {
  const response = await api.get("/admin/categories");
  return response.data.data;
}

export async function updateCategory(id, payload) {
  const response = await api.patch(`/admin/categories/${id}`, payload);
  return response.data.data;
}

export async function toggleCategory(id, active) {
  const response = await api.patch(`/admin/categories/${id}/toggle`, null, {
    params: { active }
  });
  return response.data.data;
}

export async function listAdminAuditLogs(params) {
  const response = await api.get("/admin/audit-logs", {
    params: normalizeParams(params)
  });
  return response.data.data;
}

export async function listAdminRecycleRecords(entityType, params = {}) {
  const response = await api.get("/admin/recycle-bin", {
    params: normalizeParams({
      entityType,
      ...params
    })
  });
  return response.data.data;
}

export async function restoreAdminRecycleRecord(entityType, id) {
  const response = await api.patch(`/admin/recycle-bin/${entityType}/${id}/restore`);
  return response.data.data;
}

export async function downloadAdminPdfExport(module, params = {}) {
  const normalizedParams = normalizeParams(params);

  if (module === "audit-logs" && normalizedParams.module) {
    normalizedParams.auditModule = normalizedParams.module;
    delete normalizedParams.module;
  }

  const response = await api.get(`/admin/exports/${module}/pdf`, {
    params: normalizedParams,
    responseType: "blob"
  });

  const filename = extractFilename(
    response.headers["content-disposition"],
    `vcollab-${module}.pdf`
  );
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

