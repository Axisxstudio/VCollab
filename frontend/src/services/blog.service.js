import api from "../lib/axios";

export async function listBlogs(params) {
  const response = await api.get("/blogs", { params });
  return response.data.data;
}

export async function listUserBlogs(username, params) {
  const response = await api.get(`/blogs/user/${username}`, { params });
  return response.data.data;
}

export async function getBlog(id) {
  const response = await api.get(`/blogs/${id}`);
  return response.data.data;
}

export async function createBlog(payload) {
  const response = await api.post("/blogs", payload);
  return response.data.data;
}

export async function updateBlog(id, payload) {
  const response = await api.put(`/blogs/${id}`, payload);
  return response.data.data;
}

export async function deleteBlog(id) {
  const response = await api.delete(`/blogs/${id}`);
  return response.data.data;
}
