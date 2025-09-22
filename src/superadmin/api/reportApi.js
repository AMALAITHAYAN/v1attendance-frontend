import axios from "./axiosInstance";
import { saHeadersOrThrow } from "../utils/saAuth";

export async function fetchActiveSessions() {
  const headers = saHeadersOrThrow();
  const res = await axios.get("/api/admin/reports/active-sessions", { headers });
  return res.data; // List<SessionBrief>
}

export async function fetchStudentSummary(studentId, fromISO, toISO) {
  const headers = saHeadersOrThrow();
  const res = await axios.get(`/api/admin/reports/students/${studentId}/summary`, {
    headers,
    params: { from: fromISO, to: toISO },
  });
  return res.data; // StudentSummary
}
