import axios from "axios";

const defaultBaseUrl = import.meta.env.DEV ? "http://localhost:4001" : "/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kyzmat_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
