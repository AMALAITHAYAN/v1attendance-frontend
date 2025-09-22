import axios from "../../shared/api/axiosInstance";
import { teacherHeadersOrThrow } from "../utils/teacherAuth";

/** Create a class: { year, department, section, block, name } → ClassRoom */
export async function createClass(input) {
  const headers = teacherHeadersOrThrow();
  const payload = {
    year: String(input.year ?? "").trim(),
    department: (input.department ?? "").trim(),
    section: (input.section ?? "").trim(),
    block: (input.block ?? "").trim(),
    name: (input.name ?? "").trim(),
  };
  if (!payload.year || !payload.department || !payload.section || !payload.block || !payload.name) {
    throw new Error("All fields (year, department, section, block, name) are required");
  }
  const { data } = await axios.post("/api/teacher/classes", payload, { headers });
  return data; // ClassRoom
}

/** List classes visible to the teacher → ClassRoom[] */
export async function listClasses() {
  const headers = teacherHeadersOrThrow();
  const { data } = await axios.get("/api/teacher/classes", { headers });
  return data;
}

/** Roster for a class → StudentProfile[] */
export async function getClassRoster(classId) {
  const headers = teacherHeadersOrThrow();
  const { data } = await axios.get(`/api/teacher/classes/${classId}/students`, { headers });
  return data;
}
