import { create } from "zustand";

const storage = typeof window !== "undefined" ? window.localStorage : null;

function readStoredUser() {
  if (!storage) {
    return null;
  }

  const rawUser = storage.getItem("vcollab_user");
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    storage.removeItem("vcollab_user");
    return null;
  }
}

const storedToken = storage?.getItem("vcollab_token") || null;
const storedUser = readStoredUser();

export const useAuthStore = create((set) => ({
  token: storedToken,
  user: storedUser,
  setAuth: (token, user) => {
    storage?.setItem("vcollab_token", token);
    storage?.setItem("vcollab_user", JSON.stringify(user));
    set({ token, user });
  },
  clearAuth: () => {
    storage?.removeItem("vcollab_token");
    storage?.removeItem("vcollab_user");
    set({ token: null, user: null });
  }
}));
