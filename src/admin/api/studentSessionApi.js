// src/student/api/studentSessionApi.js
import axios from "axios";
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export async function getStudentSessionMeta(sessionId) {
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
      const err = new Error("Session overed");
      err.code = "SESSION_EXPIRED";
      throw err;
    }
    throw e;
  }
}
