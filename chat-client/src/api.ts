import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const authApi = {
  login: (data: any) => api.post("/auth/login", data),
  register: (data: any) => api.post("/auth/register", data),
};

export const roomApi = {
  list: (token: string) =>
    api.get("/rooms", { headers: { Authorization: `Bearer ${token}` } }),
  create: (data: any, token: string) =>
    api.post("/rooms", data, { headers: { Authorization: `Bearer ${token}` } }),
};

export const aiApi = {
  chat: (message: string, token: string) =>
    api.post(
      "/ai/chat",
      { message },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
  summarize: (messages: any[], token: string) =>
    api.post(
      "/ai/summarize",
      { messages },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
};

export default api;
