import axios from "./axiosInstance";
import { saHeadersOrThrow } from "../utils/saAuth";

/** CREATE */
export async function createTeacher(payload) {
  const headers = saHeadersOrThrow();
  const res = await axios.post("/api/admin/teachers", payload, { headers });
  return res.data;
}

/** LIST (paged, optional q) */
export async function listTeachers({ page = 0, size = 10, q = "" } = {}) {
  const headers = saHeadersOrThrow();
  const res = await axios.get("/api/admin/teachers", {
    headers,
    params: { page, size, q: q || undefined },
  });
  return res.data; // Spring Page<TeacherResponse>
}

/** READ */
export async function getTeacher(id) {
  const headers = saHeadersOrThrow();
  const res = await axios.get(`/api/admin/teachers/${id}`, { headers });
  return res.data;
}

/** UPDATE */
export async function updateTeacher(id, body) {
  const headers = saHeadersOrThrow();
  const res = await axios.put(`/api/admin/teachers/${id}`, body, { headers });
  return res.data;
}

/** DELETE */
export async function deleteTeacher(id) {
  const headers = saHeadersOrThrow();
  await axios.delete(`/api/admin/teachers/${id}`, { headers });
}
