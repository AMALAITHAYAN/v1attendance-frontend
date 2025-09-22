import axios from "../../shared/api/axiosInstance";
import { teacherHeadersOrThrow } from "../utils/teacherAuth";

/** ✅ Create a student inside an existing Class (preferred) */
export async function createStudentInClass(classId, form, photoFile) {
  const base = teacherHeadersOrThrow();
  const headers = { ...base, /* ensure JSON header is not sent */ "Content-Type": undefined };

  const payload = {
    username: form.username?.trim(),
    name: form.name?.trim(),
    rollNo: form.rollNo?.trim(),
    className: null,
    year: null,
    department: null,
    password: form.password || "1234",
  };

  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (photoFile) fd.append("photo", photoFile);

  const { data } = await axios.post(`/api/teacher/classes/${classId}/students`, fd, { headers });
  return data;
}

/** Legacy: create via old endpoint (kept for back-compat) */
export async function createStudent(form, photoFile) {
  const base = teacherHeadersOrThrow();
  const headers = { ...base, "Content-Type": undefined };

  const payload = {
    username: form.username?.trim(),
    name: form.name?.trim(),
    rollNo: form.rollNo?.trim(),
    className: form.className?.trim(),
    year: form.year?.trim(),
    department: form.department?.trim(),
    password: form.password || "1234",
  };

  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (photoFile) fd.append("photo", photoFile);

  const res = await axios.post("/api/teacher/students", fd, { headers });
  return res.data;
}

/** Bulk upload .xlsx (legacy sheet columns) */
export async function bulkUploadStudents(file) {
  if (!file) throw new Error("Choose a .xlsx file");
  const base = teacherHeadersOrThrow();
  const headers = { ...base, "Content-Type": undefined };

  const fd = new FormData();
  fd.append("file", file);

  const res = await axios.post("/api/teacher/students/bulk-upload", fd, { headers });
  return res.data;
}

/** Download the CSV template */
export async function downloadTemplate() {
  const res = await axios.get("/api/teacher/students/template", { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students_template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
