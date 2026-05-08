import api from "../lib/axios";

export async function followUser(userId) {
  const response = await api.post("/follows", { userId });
  return response.data.data;
}

export async function unfollowUser(userId) {
  const response = await api.delete("/follows", { params: { userId } });
  return response.data.data;
}

export async function getFollowStatus(userId) {
  const response = await api.get("/follows/status", { params: { userId } });
  return response.data.data;
}

export async function listFollowers(userId) {
  const response = await api.get("/follows/followers", { params: { userId } });
  return response.data.data;
}

export async function listFollowing(userId) {
  const response = await api.get("/follows/following", { params: { userId } });
  return response.data.data;
}
