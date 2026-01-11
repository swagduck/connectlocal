import axios from "axios";

const api = axios.create({
  // Đảm bảo KHÔNG có dấu / ở cuối cùng
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Đính kèm token để Backend nhận diện Admin
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
