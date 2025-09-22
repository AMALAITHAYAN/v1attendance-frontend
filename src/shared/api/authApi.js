// src/shared/api/authApi.js
import axios from "./axiosInstance";

/* ---------- helpers ---------- */
function normalizeRole(val) {
  if (!val) return null;
  const up = String(val).toUpperCase();
  return ["SUPER_ADMIN", "TEACHER", "STUDENT"].includes(up) ? up : null;
}

function parseLoginPayload(data) {
  let role = null;
  let message = "";

  if (data && typeof data === "object") {
    role = normalizeRole(data.role);
    message = data.message ?? "";
    return { role, message };
  }

  if (typeof data === "string") {
    const str = data.trim();
    // try JSON-in-string first
    try {
      const parsed = JSON.parse(str);
      role = normalizeRole(parsed.role);
      message = parsed.message ?? str;
      return { role, message };
    } catch {
      // fallback: plain text like "Login success! Role: TEACHER"
      const m = /Role:\s*(SUPER_ADMIN|TEACHER|STUDENT)/i.exec(str);
      role = m ? m[1].toUpperCase() : null;
      message = str;
      return { role, message };
    }
  }

  return { role: null, message: "" };
}

function normalizeAxiosError(err, fallback = "Request failed") {
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (status === 401) return new Error("Invalid credentials");

  if (typeof data === "string" && data.trim()) return new Error(data.trim());
  if (data && typeof data === "object") {
    const msg = data.message || data.error || JSON.stringify(data);
    return new Error(msg);
  }
  return new Error(err?.message || fallback);
}

/* ---------- API ---------- */

/**
 * POST /api/auth/login
 * Accepts:
 *  - JSON object { message, role }
 *  - String body, possibly JSON-in-string, or "Role: X" suffix
 * Returns: { message, role }
 */
export async function login({ username, password }) {
  try {
    const res = await axios.post("/api/auth/login", { username, password });
    return parseLoginPayload(res?.data);
  } catch (err) {
    throw normalizeAxiosError(err, "Login failed");
  }
}

/**
 * POST /api/auth/change-password
 * Body: { username, oldPassword, newPassword }
 * Returns: server text or object; we return the raw data for UI to show.
 */
export async function changePassword({ username, oldPassword, newPassword }) {
  if (!username || !oldPassword || !newPassword) {
    throw new Error("All fields are required");
  }
  try {
    const { data } = await axios.post("/api/auth/change-password", {
      username,
      oldPassword,
      newPassword,
    });
    return data ?? "Password changed";
  } catch (err) {
    throw normalizeAxiosError(err, "Failed to change password");
  }
}

/* Backward-compat alias */
export async function changePasswordApi(args) {
  return changePassword(args);
}
