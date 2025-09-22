import axios from "./axiosInstance";
import { teacherHeadersOrThrow } from "../utils/teacherAuth";

/** POST /api/teacher/attendance/manual */
export async function manualMarkAttendance({ sessionId, studentId, reason }) {
  const headers = teacherHeadersOrThrow();
  const payload = {
    sessionId: Number(sessionId),
    studentId: Number(studentId),
    reason: reason || null,
  };
  const res = await axios.post("/api/teacher/attendance/manual", payload, {
    headers,
  });
  return res.data; // Attendance object
}
//attendanceApi