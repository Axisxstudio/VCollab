import api from "../lib/axios";

export async function uploadMedia(file, context = "general") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("context", context);
  const response = await api.post("/media/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data;
}
