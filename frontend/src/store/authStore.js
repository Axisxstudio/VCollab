import { create } from "zustand";

const TOKEN_KEY = "vcollab_token";
const USER_KEY = "vcollab_user";

function getStorage(type) {
  if (typeof window === "undefined") {
    return null;
  }

  return type === "local" ? window.localStorage : window.sessionStorage;
}

function clearAuthFromStorage(storage) {
  storage?.removeItem(TOKEN_KEY);
  storage?.removeItem(USER_KEY);
}

function readStoredUser(storage) {
  if (!storage) {
    return null;
  }

  const rawUser = storage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    storage.removeItem(USER_KEY);
    return null;
  }
}

function readStoredAuth(type) {
  const storage = getStorage(type);
  if (!storage) {
    return { token: null, user: null };
  }

  return {
    token: storage.getItem(TOKEN_KEY),
    user: readStoredUser(storage)
  };
}

function getInitialAuthState() {
  const localAuth = readStoredAuth("local");
  if (localAuth.token) {
    return { ...localAuth, rememberMe: true };
  }

  const sessionAuth = readStoredAuth("session");
  if (sessionAuth.token) {
    return { ...sessionAuth, rememberMe: false };
  }

  return { token: null, user: null, rememberMe: false };
}

const initialState = getInitialAuthState();

export const useAuthStore = create((set) => ({
  token: initialState.token,
  user: initialState.user,
  rememberMe: initialState.rememberMe,
  setAuth: (token, user, options = {}) => {
    const rememberMe = options.rememberMe ?? true;
    const targetStorage = getStorage(rememberMe ? "local" : "session");
    const otherStorage = getStorage(rememberMe ? "session" : "local");

    clearAuthFromStorage(otherStorage);
    targetStorage?.setItem(TOKEN_KEY, token);
    targetStorage?.setItem(USER_KEY, JSON.stringify(user));

    set({ token, user, rememberMe });
  },
  clearAuth: () => {
    clearAuthFromStorage(getStorage("local"));
    clearAuthFromStorage(getStorage("session"));
    set({ token: null, user: null, rememberMe: false });
  }
}));
