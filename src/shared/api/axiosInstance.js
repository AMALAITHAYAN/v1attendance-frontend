import axios from "axios";

const BASE =
  process.env.REACT_APP_API_BASE_URL?.trim() || "http://localhost:8080";

console.log("Axios baseURL →", BASE); // temporary: confirms at runtime

const axiosInstance = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

/* ⬇️ If we send FormData, drop the JSON Content-Type so the browser can set
   multipart/form-data with the correct boundary. */
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
