// src/student/utils/studentAuth.js
export const getStudentUser = () =>
  localStorage.getItem("attendance:studentUser") || "";

export const getStudentPass = () =>
  localStorage.getItem("attendance:studentPass") || "";

export const setStudentPass = (pass) => {
  if (pass == null || pass === "") {
    localStorage.removeItem("attendance:studentPass");
  } else {
    localStorage.setItem("attendance:studentPass", pass);
  }
};

export const clearStudent = () => {
  localStorage.removeItem("attendance:studentUser");
  localStorage.removeItem("attendance:studentPass");
};

export const studentHeadersOrThrow = () => {
  const u = getStudentUser();
  const p = getStudentPass();
  if (!u || !p) throw new Error("Student credentials missing");
  return { "X-Auth-Username": u, "X-Auth-Password": p };
};
