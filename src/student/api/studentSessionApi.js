// src/student/api/studentSessionApi.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

/**
 * Fetch student-visible session metadata.
 * Returns the server payload (normalized) when valid & active.
 *
 * Throws:
 *  - { code: "SESSION_NOT_FOUND" } on 404
 *  - { code: "SESSION_EXPIRED" }  on 410 OR when meta shows inactive/ended
 */
export async function getStudentSessionMeta(sessionId) {
  if (sessionId == null) throw new Error("sessionId is required");

  const api = axios.create({ baseURL: API_BASE });

  try {
    const { data } = await api.get(`/api/student/sessions/${sessionId}`);

    // Additional client-side guard: treat inactive or ended sessions as expired
    const now   = Date.now();
    const start = data?.startTime ? new Date(data.startTime).getTime() : null;
    const end   = data?.endTime   ? new Date(data.endTime).getTime()   : null;

    const inactive = data?.active === false;
    const expired  = end && now > end;

    if (inactive || expired) {
      const err = new Error("Session overed");
      err.code = "SESSION_EXPIRED";
      throw err;
    }

    // Normalize and return
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
      const err = new Error("Session overed");
      err.code = "SESSION_EXPIRED";
      throw err;
    }
    // If we already threw a coded error above, keep it
    if (e?.code === "SESSION_EXPIRED" || e?.code === "SESSION_NOT_FOUND") throw e;

    // Bubble up any other error so the caller can handle it
    throw e;
  }
}

/** Convenience: get only the flow (still throws on not-found/expired). */
export async function getSessionFlow(sessionId) {
  const meta = await getStudentSessionMeta(sessionId);
  return Array.isArray(meta.flow) ? meta.flow : [];
}
