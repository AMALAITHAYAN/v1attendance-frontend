import axios from "./axiosInstance";
import { saHeadersOrThrow } from "../utils/saAuth";

export async function registerFaceForStudent(studentId) {
  if (!studentId) throw new Error("Student ID required");
  const headers = saHeadersOrThrow();
  const res = await axios.post(`/api/admin/students/${studentId}/face/register`, null, { headers });
  return res.data; // Map<String,Object> from backend
}
