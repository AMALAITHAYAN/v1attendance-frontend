// src/student/api/studentSessionApi.js
import axios from "axios";

// Always prefer env var, fallback to deployed backend (Render)
const API_BASE =
  process.env.REACT_APP_API_BASE_URL?.trim() ||
  "https://v1attendance-backend.onrender.com"; // ⬅️ your Render backend URL

console.log("Axios (student) baseURL →", API_BASE);

/**
 * Fetch student-visible session metadata.
 * Returns the server payload (normalized) when valid & active.
 *
 * Throws:
 *  - { code: "SESSION_NOT_FOUND" } on 404
 *  - { code: "SESSION_EXPIRED" }  on 410
 */
export async function getStudentSessionMeta(sessionId) {
  if (!sessionId) throw new Error("sessionId is required");

  const api = axios.create({ baseURL: API_BASE });

  try {
    const { data } = await api.get(`/api/student/sessions/${sessionId}`);
    return data; // StudentSessionMeta
  } catch (e) {
    const s = e?.response?.status;
    if (s === 404) {
      const err = new Error("Session not found");
      err.code = "SESSION_NOT_FOUND";
      throw err;
    }
    if (s === 410) {
      const err = new Error("Session expired");
      err.code = "SESSION_EXPIRED";
      throw err;
    }
    throw e;
  }
}
