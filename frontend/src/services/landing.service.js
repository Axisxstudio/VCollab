import api from "../lib/axios";

export async function getLandingOverview() {
  const response = await api.get("/landing/overview");
  return response.data.data;
}
