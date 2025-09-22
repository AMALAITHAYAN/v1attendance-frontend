import axios from "axios";

// Use env var first, fallback to deployed backend (Render)
const BASE =
  (process.env.REACT_APP_API_BASE_URL &&
    process.env.REACT_APP_API_BASE_URL.trim()) ||
  "https://v1attendance-backend.onrender.com"; // ⬅️ replace with your actual backend URL

console.log("Axios baseURL →", BASE);

const axiosInstance = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

axiosInstance.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (typeof err?.response?.data === "string" ? err.response.data : "") ||
      err?.message ||
      "Request failed";

    return Promise.reject({ ...err, message });
  }
);

export default axiosInstance;
