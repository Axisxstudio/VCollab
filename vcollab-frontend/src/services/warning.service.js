import api from "../lib/axios";

export async function listWarnings(params) {
  const response = await api.get("/warnings", { params });
  return response.data.data;
}

export async function acknowledgeWarning(id) {
  const response = await api.patch(`/warnings/${id}/ack`);
  return response.data.data;
}

export async function listAdminWarnings(params) {
  const response = await api.get("/admin/warnings", { params });
  return response.data.data;
}

export async function createWarning(payload) {
  const response = await api.post("/admin/warnings", payload);
  return response.data.data;
}
