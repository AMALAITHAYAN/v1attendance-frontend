// src/student/api/reportsApi.js
import api from "./axiosInstance";
import { studentHeadersOrThrow } from "../utils/studentAuth";

/** Helper: accept Date | string (datetime-local) | ISO and return ISO string */
function toIso(v) {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString();
  // "yyyy-MM-ddTHH:mm" (from <input type="datetime-local">) → Date in local tz
  return new Date(v).toISOString();
}

/** GET /api/student/reports/me/summary?from&to */
export async function getMySummary({ from, to }) {
  const params = { from: toIso(from), to: toIso(to) };

  const { data } = await api.get("/api/student/reports/me/summary", {
    headers: { ...studentHeadersOrThrow() },
    params,
  });

  // data: { present, total, percentage, bySubject:[{subject, present, total, percentage}] }
  return data;
}

/** GET /api/student/reports/me/logs?from&to */
export async function getMyLogs({ from, to }) {
  const params = { from: toIso(from), to: toIso(to) };

  const { data } = await api.get("/api/student/reports/me/logs", {
    headers: { ...studentHeadersOrThrow() },
    params,
  });

  // data: [{ attendanceId, sessionId, subject, markedAt, success, geoOk, wifiOk, faceOk, qrOk }]
  return Array.isArray(data) ? data : [];
}
