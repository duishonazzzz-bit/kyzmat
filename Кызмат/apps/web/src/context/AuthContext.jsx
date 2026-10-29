import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

const TOKEN_KEY = "kyzmat_token";
const USER_KEY = "kyzmat_user";

function loadStoredUser() {
  try {
    const cached = localStorage.getItem(USER_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => loadStoredUser());

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const persistSession = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  };

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    persistSession(data);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persistSession(data);
    return data.user;
  };

  const refreshProfile = async () => {
    if (!token) return null;

    try {
      const { data } = await api.get("/users/me");
      setUser(data);
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401 || status === 404) {
        clearSession();
      }

      return null;
    }
  };

  const logout = () => {
    clearSession();
  };

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token]);

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token), login, register, logout, refreshProfile }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
