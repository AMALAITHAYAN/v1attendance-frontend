import api from "./axiosInstance";
import { studentHeadersOrThrow } from "../utils/studentAuth";

/**
 * Final commit after step checks:
 * raw: { sessionId (req), publicIp?, studentLat?, studentLng?, qrToken? }
 * selfieFile: File | null (only if FACE is part of the flow)
 *
 * Returns:
 *  { ok:true, data }          on 200
 *  { ok:false, error:{...} }  on 409 (should be rare now)
 *  throws Error               otherwise
 */
export async function markAttendanceApi(raw, selfieFile /* File|null */) {
  if (raw?.sessionId == null) throw new Error("sessionId is required");

  const payload = { sessionId: Number(raw.sessionId) };
  if (raw.publicIp) payload.publicIp = String(raw.publicIp);
  if (raw.qrToken) payload.qrToken = String(raw.qrToken);
  if (raw.studentLat !== "" && raw.studentLat != null) payload.studentLat = Number(raw.studentLat);
  if (raw.studentLng !== "" && raw.studentLng != null) payload.studentLng = Number(raw.studentLng);

  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }), "data.json");
  if (selfieFile instanceof File) fd.append("selfie", selfieFile, selfieFile.name || "selfie.jpg");

  try {
    const { data } = await api.post("/api/student/attendance/mark", fd, {
      headers: {
        ...studentHeadersOrThrow(),
        Accept: "application/json",
        // no Content-Type here (browser sets multipart boundary)
      },
    });
    return { ok: true, data };
  } catch (e) {
    if (e.status === 409 && e.data) return { ok: false, error: e.data };
    throw e;
  }
}
