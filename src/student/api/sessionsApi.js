import api from "./axiosInstance";

/** Get the validation flow for a session, e.g. ["WIFI","GEO","FACE","QR"]. */
export async function getSessionFlow(sessionId) {
  if (sessionId == null) throw new Error("sessionId is required");
  try {
    const { data } = await api.get(`/api/student/sessions/${sessionId}/flow`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    // Fallback so UI can still render
    return ["WIFI", "GEO", "FACE", "QR"];
  }
}