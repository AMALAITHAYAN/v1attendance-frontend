// src/admin/api/sessionsApi.js
import axios from "./axiosInstance";
import { teacherHeadersOrThrow } from "../utils/teacherAuth";
import { listClasses } from "./classesApi";

/** tiny helper used when wifiPolicy requires a public IP */
export async function getPublicIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data?.ip || "";
  } catch {
    return "";
  }
}

/** GET plain string QR token that rotates each interval */
export async function fetchCurrentQrToken(sessionId) {
  const headers = teacherHeadersOrThrow();
  const res = await axios.get(`/api/teacher/qrs/${sessionId}/current-token`, { headers });
  return typeof res.data === "string" ? res.data : String(res.data);
}

/**
 * Start a session (legacy shape – still supported by backend)
 * returns: Session
 */
export async function startSession(input) {
  const headers = teacherHeadersOrThrow();

  const payload = {
    year: Number(input.year),
    department: input.department?.trim(),
    className: input.className?.trim(),
    subject: input.subject?.trim(),
    startTime: input.startTime, // ISO
    endTime: input.endTime,     // ISO
    latitude: input.latitude === "" || input.latitude == null ? null : Number(input.latitude),
    longitude: input.longitude === "" || input.longitude == null ? null : Number(input.longitude),
    radiusMeters:
      input.radiusMeters === "" || input.radiusMeters == null ? null : Number(input.radiusMeters),
    flow: Array.isArray(input.flow) ? input.flow : [],
    wifiPolicy: input.wifiPolicy || "NONE",
    qrIntervalSeconds: Number(input.qrIntervalSeconds ?? input.qrIntervalSec ?? 30),
    publicIp: input.publicIp ?? null,
    networkSignature: input.networkSignature ?? null,
  };

  if ((payload.wifiPolicy === "PUBLIC_IP" || payload.wifiPolicy === "BOTH") && !payload.publicIp) {
    payload.publicIp = await getPublicIp();
  }
  if (payload.wifiPolicy === "NONE") payload.publicIp = null;

  const { data } = await axios.post("/api/teacher/sessions/start", payload, { headers });
  return data;
}

/**
 * Start a session by Class (recommended for the new flow)
 * classId: number, config: same fields as startSession except year/department/className are omitted
 */
export async function startSessionForClass(classId, config) {
  const classes = await listClasses();
  const cls = classes.find((c) => Number(c.id) === Number(classId));
  if (!cls) throw new Error("Class not found");

  return startSession({
    ...config,
    year: cls.year,
    department: cls.department,
    className: cls.name,
  });
}

export async function stopSession(sessionId) {
  const headers = teacherHeadersOrThrow();
  const { data } = await axios.post(`/api/teacher/sessions/${sessionId}/stop`, null, { headers });
  return data;
}

export async function fetchSessionSummary(sessionId) {
  const headers = teacherHeadersOrThrow();
  const { data } = await axios.get(`/api/teacher/sessions/${sessionId}/summary`, { headers });
  return data; // { sessionId, present, total, ratio }
}

export async function fetchSessionById(id) {
  const { data } = await axios.get(`/api/teacher/sessions/${id}`);
  return data; // should include { id, flow: ["WIFI","GEO","FACE","QR"], ... }
}

/** SSE: live stream of attendance marks on the teacher session page */
export function openSessionEventStream(sessionId, handlers = {}) {
  // EventSource cannot send custom headers; backend endpoint is open/public.
  const base = (axios?.defaults?.baseURL || "").replace(/\/+$/, "");
  const url = `${base}/api/teacher/sessions/${sessionId}/events`;

  const es = new EventSource(url);

  es.addEventListener("ping", (e) => handlers.onPing?.(e));
  es.addEventListener("attendance-marked", (e) => {
    try {
      const payload = JSON.parse(e.data);
      handlers.onMarked?.(payload);
    } catch {
      // ignore parse errors
    }
  });
  es.onerror = (e) => handlers.onError?.(e);

  return {
    close: () => es.close(),
    raw: es,
  };
}
