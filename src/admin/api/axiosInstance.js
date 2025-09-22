// src/api/axiosInstance.js (teacher/admin)
import axios from "axios";

/**
 * Teacher-scoped axios client.
 * Attaches X-Auth-Username / X-Auth-Password from localStorage.
 */
const axiosInstance = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL?.trim() ||
    "https://v1attendance-backend.onrender.com", // ⬅️ replace with your Render backend URL
});

// (debug) see the base URL in devtools
try {
  console.log("Axios (admin) baseURL →", axiosInstance.defaults.baseURL);
} catch {}

/**
 * Attach teacher credentials from localStorage.
 */
axiosInstance.interceptors.request.use((config) => {
  try {
    // username may be stored as a plain string OR as JSON { username }
    const raw = localStorage.getItem("attendance:user");
    if (raw) {
      let username = raw;
      try {
        const maybe = JSON.parse(raw);
        if (maybe && typeof maybe === "object" && maybe.username) {
          username = maybe.username;
        }
      } catch {
        /* raw is already a string */
      }
      if (username) config.headers["X-Auth-Username"] = username;
    }

    const teacherPass = localStorage.getItem("attendance:teacherPass");
    if (teacherPass) config.headers["X-Auth-Password"] = teacherPass;
  } catch {
    /* ignore */
  }
  return config;
});

/**
 * Normalize server errors -> always throw Error(message)
 */
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (typeof err?.response?.data === "string"
        ? err.response.data
        : "") ||
      err?.message ||
      "Request failed";
    const e = new Error(message);
    e.status = err?.response?.status;
    e.data = err?.response?.data;
    throw e;
  }
);

export default axiosInstance;
