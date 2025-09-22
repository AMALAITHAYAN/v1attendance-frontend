// lightweight axios instance for student APIs
import axios from "axios";

const baseURL =
  process.env.REACT_APP_API_BASE_URL?.trim() ||
  "https://v1attendance-backend.onrender.com"; // ⬅️ replace with your Render backend URL

console.log("Axios (student) baseURL →", baseURL);

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export default api;
