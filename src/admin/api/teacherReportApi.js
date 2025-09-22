import axios from "./axiosInstance";
import { teacherHeadersOrThrow } from "../utils/teacherAuth";

/** GET /api/teacher/reports/sessions?from&to → SessionBrief[] */
export async function fetchTeacherSessions(fromISO, toISO) {
  const headers = teacherHeadersOrThrow();
  const { data } = await axios.get("/api/teacher/reports/sessions", {
    params: { from: fromISO, to: toISO },
    headers,
  });
  return data;
}

/** GET /api/teacher/reports/sessions/{id}/summary → { sessionId, present, total } */
export async function fetchTeacherSessionSummary(sessionId) {
  const headers = teacherHeadersOrThrow();
  const { data } = await axios.get(
    `/api/teacher/reports/sessions/${sessionId}/summary`,
    { headers }
  );
  return data;
}
