import axios from "axios";

const BASE =
  (process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.trim()) ||
  "http://localhost:8080";

const axiosInstance = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

axiosInstance.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "Request failed";
    return Promise.reject({ ...err, message });
  }
);

export default axiosInstance;
