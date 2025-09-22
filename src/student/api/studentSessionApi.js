// src/student/api/studentSessionApi.js
import axios from "axios";

// Always use the deployed backend unless overridden by env var
const API_BASE =
  process.env.REACT_APP_API_BASE_URL?.trim() ||
  "https://v1attendance-backend.onrender.com"; // ⬅️ replace with your actual Render backend URL

console.log("Axios (student session) baseURL →", API_BASE);

/**
 * Fetch student-visible session metadata.
 * Returns the server payload (normalized) when valid & active.
 *
 * Throws:
 *  - { code: "SESSION_NOT_FOUND" } on 404
 *  - { code: "SESSION_EXPIRED" }  on 410 OR when meta shows inactive/ended
 */
export async function getStudentSessionMeta(sessionId) {
  if (!sessionId) throw new Error("sessionId is required");

  const api = axios.create({ baseURL: API_BASE });

  try {
    const { data } = await api.get(`/api/student/sessions/${sessionId}`);

    // Guard against expired/inactive sessions
    const now = Date.now();
    const end = data?.endTime ? new Date(data.endTime).getTime() : null;

    if (data?.active === false || (end && now > end)) {
      const err = new Error("Session expired");
      err.code = "SESSION_EXPIRED";
      throw err;
    }

    return {
      id: data.id,
      active: data.active !== false,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      flow: Array.isArray(data.flow) ? data.flow : [],
      wifiPolicy: data.wifiPolicy ?? "PUBLIC_IP",
      teacherPublicIp: data.teacherPublicIp ?? "",
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      radiusMeters: data.radiusMeters ?? null,
      qrIntervalSeconds: data.qrIntervalSeconds ?? 5,
    };
  } catch (e) {
    const status = e?.response?.status;

    if (status === 404) {
      const err = new Error("Session not found");
      err.code = "SESSION_NOT_FOUND";
      throw err;
    }
    if (status === 410) {
      const err = new Error("Session expired");
      err.code = "SESSION_EXPIRED";
      throw err;
    }
    throw e;
  }
}

/** Convenience: get only the flow (still throws on not-found/expired). */
export async function getSessionFlow(sessionId) {
  const meta = await getStudentSessionMeta(sessionId);
  return Array.isArray(meta.flow) ? meta.flow : [];
}
