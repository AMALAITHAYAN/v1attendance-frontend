// src/admin/utils/teacherAuth.js

const USER_KEY = "attendance:user";        // stores { username, role: "TEACHER" } (but accept legacy string)
const PASS_KEY = "attendance:teacherPass"; // plain string password

/* ------------ internal helpers ------------ */
function safeGetJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    // Corrupt JSON from an old build — clean it so it can't crash rendering again.
    localStorage.removeItem(key);
    return null;
  }
}

/* ------------ getters/setters ------------ */

/** Preferred: full user object; tolerates legacy string. */
export function getTeacherUser() {
  // New format
  const obj = safeGetJSON(USER_KEY);
  if (obj && typeof obj === "object" && obj.username) {
    return { username: String(obj.username), role: "TEACHER" };
  }

  // Legacy format: plain string username
  const legacy = localStorage.getItem(USER_KEY);
  if (legacy && !legacy.trim().startsWith("{")) {
    const username = legacy.trim();
    if (username) return { username, role: "TEACHER" };
  }

  return null;
}

/** Convenience getter used by some pages. */
export function getTeacherUsername() {
  return getTeacherUser()?.username || "";
}

/** Always write the new JSON format to avoid future ambiguity. */
export function setTeacherUsername(username) {
  const u = (username || "").trim();
  if (!u) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify({ username: u, role: "TEACHER" }));
}

export function getTeacherPass() {
  return localStorage.getItem(PASS_KEY) || "";
}
export function setTeacherPass(pass) {
  localStorage.setItem(PASS_KEY, pass ?? "");
}
/** Back-compat alias used elsewhere */
export const setTeacherPassword = setTeacherPass;

/* ------------ headers for Spring ------------ */
export function teacherHeadersOrThrow() {
  const user = getTeacherUsername();
  const pass = getTeacherPass();

  if (!user) {
    const e = new Error("Teacher not logged in");
    e.status = 401;
    throw e;
  }
  if (!pass) {
    const e = new Error("Teacher password is not set");
    e.status = 401;
    throw e;
  }

  // Optional Basic header (harmless; some proxies/tools like it)
  let basic = "";
  try {
    basic = typeof btoa === "function"
      ? btoa(`${user}:${pass}`)
      : Buffer.from(`${user}:${pass}`).toString("base64");
  } catch {
    // ignore if environment doesn't support it
  }

  return {
    "X-Auth-Username": user,
    "X-Auth-Password": pass,
    ...(basic ? { Authorization: `Basic ${basic}` } : {}),
  };
}
