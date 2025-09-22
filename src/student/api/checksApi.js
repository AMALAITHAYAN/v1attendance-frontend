import api from "./axiosInstance";
import { studentHeadersOrThrow } from "../utils/studentAuth";

/** WIFI: { sessionId, studentPublicIp } -> 200 {ok:true,...} or 409 {ok:false,...} */
export async function checkWifiApi({ sessionId, studentPublicIp }) {
  if (sessionId == null) throw new Error("sessionId is required");
  try {
    const { data } = await api.post("/api/student/attendance/check/wifi", {
      sessionId: Number(sessionId),
      studentPublicIp: String(studentPublicIp || ""),
    });
    return { ok: true, data };
  } catch (e) {
    if (e.status === 409 && e.data) return { ok: false, error: e.data };
    throw e;
  }
}

/** GEO: { sessionId, studentLat, studentLng } -> 200/409 */
export async function checkGeoApi({ sessionId, studentLat, studentLng }) {
  if (sessionId == null) throw new Error("sessionId is required");
  try {
    const { data } = await api.post("/api/student/attendance/check/geo", {
      sessionId: Number(sessionId),
      studentLat: Number(studentLat),
      studentLng: Number(studentLng),
    });
    return { ok: true, data };
  } catch (e) {
    if (e.status === 409 && e.data) return { ok: false, error: e.data };
    throw e;
  }
}

/** FACE (multipart): sessionId + selfie file -> 200/409  (auth headers required) */
export async function checkFaceApi(sessionId, selfieFile /* File */) {
  if (sessionId == null) throw new Error("sessionId is required");
  if (!(selfieFile instanceof File)) throw new Error("selfie file is required");

  const fd = new FormData();
  fd.append("sessionId", String(sessionId));
  fd.append("selfie", selfieFile, selfieFile.name || "selfie.jpg");

  try {
    const { data } = await api.post("/api/student/attendance/check/face", fd, {
      headers: {
        ...studentHeadersOrThrow(),
        // let the browser set the multipart boundary
        Accept: "application/json",
      },
    });
    return { ok: true, data };
  } catch (e) {
    if (e.status === 409 && e.data) return { ok: false, error: e.data };
    throw e;
  }
}

/** QR: { sessionId, qrToken } -> 200/409  (auth headers required) */
export async function checkQrApi({ sessionId, qrToken }) {
  if (sessionId == null) throw new Error("sessionId is required");
  if (!qrToken) throw new Error("qrToken is required");

  try {
    const { data } = await api.post(
      "/api/student/attendance/check/qr",
      { sessionId: Number(sessionId), qrToken: String(qrToken) },
      { headers: { ...studentHeadersOrThrow(), Accept: "application/json" } }
    );
    return { ok: true, data };
  } catch (e) {
    if (e.status === 409 && e.data) return { ok: false, error: e.data };
    throw e;
  }
}
