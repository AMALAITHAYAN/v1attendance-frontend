import axios from "./axiosInstance";
import { teacherHeadersOrThrow } from "../utils/teacherAuth";


/** GET plain string QR token that rotates each interval */
export async function fetchCurrentQrToken(sessionId) {
  const headers = teacherHeadersOrThrow();
  const res = await axios.get(`/api/teacher/qrs/${sessionId}/current-token`, {
    headers,
  });
  return typeof res.data === "string" ? res.data : String(res.data);
}
