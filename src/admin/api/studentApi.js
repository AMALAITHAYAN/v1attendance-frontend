// src/admin/api/studentsApi.js
import axiosInstance from "../../shared/api/axiosInstance";
import { getTeacherUser, getTeacherPassword } from "../utils/teacherAuth";

/** Create a single student (photo optional). Triggers face registration on backend when photo is present. */
export async function createStudent(form, photoFile) {
  const user = getTeacherUser();
  const pass = getTeacherPassword();
  if (!user || !pass) throw new Error("Set your teacher password (top bar) first.");

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

  const res = await axiosInstance.post("/api/teacher/students", fd, {
    headers: {
      "X-Auth-Username": user.username,
      "X-Auth-Password": pass,
      // Don't set Content-Type; the browser will add the correct multipart boundary.
      Accept: "application/json",
    },
  });
  return res.data;
}

/** Bulk upload .xlsx */
export async function bulkUploadStudents(file) {
  const user = getTeacherUser();
  const pass = getTeacherPassword();
  if (!user || !pass) throw new Error("Set your teacher password (top bar) first.");
  if (!file) throw new Error("Choose a .xlsx file");

  const fd = new FormData();
  fd.append("file", file);

  const res = await axiosInstance.post("/api/teacher/students/bulk-upload", fd, {
    headers: {
      "X-Auth-Username": user.username,
      "X-Auth-Password": pass,
      Accept: "application/json",
    },
  });
  return res.data;
}

/** Download the CSV template */
export async function downloadTemplate() {
  const res = await axiosInstance.get("/api/teacher/students/template", {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students_template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
