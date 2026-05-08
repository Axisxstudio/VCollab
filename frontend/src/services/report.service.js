import api from "../lib/axios";

export async function createReport(payload) {
  const response = await api.post("/reports", payload);
  return response.data.data;
}

export async function listMyReports(params) {
  const response = await api.get("/reports", { params });
  return response.data.data;
}
