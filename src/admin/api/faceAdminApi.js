// src/superadmin/api/faceAdminApi.js
import axios from "../api/axiosInstance";

/** Build admin auth headers from localStorage */
function saHeadersOrThrow() {
  const uRaw = localStorage.getItem("attendance:user");
  const pass = localStorage.getItem("attendance:sa:password") || "";
  if (!uRaw) throw new Error("Not logged in as Super Admin");
  const u = JSON.parse(uRaw);
  if (!u?.username) throw new Error("Missing admin username");
  if (!pass) throw new Error("Enter the admin password (top bar)");
  return {
    "X-Auth-Username": u.username,
    "X-Auth-Password": pass,
  };
}

/** POST /api/admin/students/{id}/face/register */
export async function registerStudentFace(id) {
  if (!id) throw new Error("Student ID required");
  const headers = saHeadersOrThrow();
  const res = await axios.post(`/api/admin/students/${id}/face/register`, null, { headers });
  return res.data; // whatever FaceService returns (e.g., { success: true, ... })
}
