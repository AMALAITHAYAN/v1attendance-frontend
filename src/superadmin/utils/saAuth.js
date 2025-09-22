// src/superadmin/utils/saAuth.js

// New, unambiguous keys for SUPER_ADMIN
const ADMIN_USER_KEY = "attendance:adminUser";
const ADMIN_PASS_KEY = "attendance:adminPass";

// Legacy keys we still migrate/clean up
const LEGACY_USER_KEY = "attendance:user";   // used to store JSON { username, role }
const LEGACY_SA_PW_KEY = "attendance:sa:pw"; // sessionStorage password

/** Best-effort migration of old SUPER_ADMIN storage to the new keys. */
function migrateLegacySaKeys() {
  try {
    const raw = localStorage.getItem(LEGACY_USER_KEY);
    if (!raw) return;

    // If it was a JSON object with role SUPER_ADMIN, move it
    try {
      const u = JSON.parse(raw);
      if (u && String(u.role).toUpperCase() === "SUPER_ADMIN" && u.username) {
        if (!localStorage.getItem(ADMIN_USER_KEY)) {
          localStorage.setItem(ADMIN_USER_KEY, u.username);
        }
        const sessPw = sessionStorage.getItem(LEGACY_SA_PW_KEY);
        if (sessPw && !localStorage.getItem(ADMIN_PASS_KEY)) {
          localStorage.setItem(ADMIN_PASS_KEY, sessPw);
        }
      }
    } catch {
      // ignore malformed legacy value
    }

    // Remove to prevent role ambiguity going forward
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {
    // ignore
  }
}

export function getAdminUser() {
  migrateLegacySaKeys();
  try {
    const username = localStorage.getItem(ADMIN_USER_KEY);
    const pass =
      localStorage.getItem(ADMIN_PASS_KEY) ||
      sessionStorage.getItem(LEGACY_SA_PW_KEY);
    if (!username || !pass) return null;
    return { username, role: "SUPER_ADMIN" };
  } catch {
    return null;
  }
}

export function getAdminPassword() {
  return (
    localStorage.getItem(ADMIN_PASS_KEY) ||
    sessionStorage.getItem(LEGACY_SA_PW_KEY) ||
    ""
  );
}

export function setAdminPassword(pw) {
  try {
    if (pw) {
      localStorage.setItem(ADMIN_PASS_KEY, pw);        // persist across reloads
      sessionStorage.setItem(LEGACY_SA_PW_KEY, pw);    // keep session compat
    } else {
      localStorage.removeItem(ADMIN_PASS_KEY);
      sessionStorage.removeItem(LEGACY_SA_PW_KEY);
    }
  } catch {
    // ignore
  }
}

export function ensureSuperAdminOrThrow() {
  const u = getAdminUser();
  if (!u) throw new Error("Not authenticated as SUPER_ADMIN");
  return u;
}

export function saHeadersOrThrow() {
  const u = ensureSuperAdminOrThrow();
  const pw = getAdminPassword();
  if (!pw) throw new Error("Enter admin password to continue");
  return {
    "X-Auth-Username": u.username,
    "X-Auth-Password": pw,
  };
}

/** Helper you can call on logout to wipe ALL auth footprints clean. */
export function saLogoutAll() {
  try {
    // SUPER_ADMIN
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(ADMIN_PASS_KEY);
    sessionStorage.removeItem(LEGACY_SA_PW_KEY);

    // Also nuke any other-role remnants that could confuse guards
    localStorage.removeItem("attendance:user");          // teacher JSON (legacy/other flows)
    localStorage.removeItem("attendance:teacherPass");
    localStorage.removeItem("attendance:studentUser");
    localStorage.removeItem("attendance:studentPass");
    localStorage.removeItem("attendance:lastRole");
  } catch {
    // ignore
  }
}
