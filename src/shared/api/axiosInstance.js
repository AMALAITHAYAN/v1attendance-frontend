import axios from "axios";

const BASE =
  process.env.REACT_APP_API_BASE_URL?.trim() ||
  "https://v1attendance-backend.onrender.com";  // ⬅️ use backend URL here

console.log("Axios baseURL →", BASE);

const axiosInstance = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  try {
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }
  } catch {}
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "Something went wrong";
    return Promise.reject({ ...err, message });
  }
);

export default axiosInstance;
