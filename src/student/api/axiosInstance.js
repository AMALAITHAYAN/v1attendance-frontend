import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_BASE?.trim() ||
  "https://v1attendance-backend.onrender.com"; // ⬅️ your backend URL

console.log("Axios (student) baseURL →", API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Normalize server errors into Error objects (preserve status & data)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status ?? 0;
    const data = err?.response?.data;
    let message;
    if (typeof data === "string") message = data;
    else if (data && typeof data === "object")
      message = data.message || data.error || JSON.stringify(data);
    else message = err?.message || "Request failed";

    const e = new Error(message);
    e.status = status;
    e.data = data;
    return Promise.reject(e);
  }
);

export default api;
