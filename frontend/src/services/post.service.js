import api from "../lib/axios";

export async function listPosts(params) {
  const response = await api.get("/posts", { params });
  return response.data.data;
}

export async function listUserPosts(username, params) {
  const response = await api.get(`/posts/user/${username}`, { params });
  return response.data.data;
}

export async function getPost(id) {
  const response = await api.get(`/posts/${id}`);
  return response.data.data;
}

export async function createPost(payload) {
  const response = await api.post("/posts", payload);
  return response.data.data;
}

export async function updatePost(id, payload) {
  const response = await api.put(`/posts/${id}`, payload);
  return response.data.data;
}

export async function deletePost(id) {
  const response = await api.delete(`/posts/${id}`);
  return response.data.data;
}
