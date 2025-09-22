import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Import react-toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginPage from "./shared/pages/LoginPage";

// TEACHER area (lives under /admin)
import TeacherDashboard from "./admin/pages/TeacherDashboard";
import StartSessionPage from "./admin/pages/StartSessionPage";
import ActiveSessionPage from "./admin/pages/ActiveSessionPage";
import TeacherStudentsPage from "./admin/pages/TeacherStudentsPage";
import TeacherReportsPage from "./admin/pages/TeacherReportsPage";

// SUPER ADMIN
import SuperAdminDashboard from "./superadmin/pages/SuperAdminDashboard";
import TeacherListPage from "./superadmin/pages/TeacherListPage";
import CreateTeacherPage from "./superadmin/pages/CreateTeacherPage";
import EditTeacherPage from "./superadmin/pages/EditTeacherPage";
import LiveSessionsPage from "./superadmin/pages/LiveSessionsPage";
import ReportsActiveSessionsPage from "./superadmin/pages/ReportsActiveSessionsPage";
import ReportsStudentSummaryPage from "./superadmin/pages/ReportsStudentSummaryPage";
import FaceRegisterPage from "./superadmin/pages/FaceRegisterPage";

// STUDENT
import StudentDashboard from "./student/pages/StudentDashboard";
import MarkAttendancePage from "./student/pages/MarkAttendancePage";
import StudentReportsPage from "./student/pages/StudentReportsPage";
import StudentScorePage from "./student/pages/StudentScorePage"; // ✅ fixed path

// COMMON
import ChangePasswordPage from "./shared/pages/ChangePasswordPage";

/* ---------------- helpers (read-only; no state) ---------------- */

function getActiveRole() {
  if (localStorage.getItem("attendance:adminUser") && localStorage.getItem("attendance:adminPass")) {
    return "SUPER_ADMIN";
  }
  if (localStorage.getItem("attendance:user") && localStorage.getItem("attendance:teacherPass")) {
    return "TEACHER";
  }
  if (localStorage.getItem("attendance:studentUser") && localStorage.getItem("attendance:studentPass")) {
    return "STUDENT";
  }
  return null;
}

function homeForRole(role) {
  switch (role) {
    case "SUPER_ADMIN": return "/superadmin";
    case "TEACHER":     return "/admin";
    case "STUDENT":     return "/student";
    default:            return "/login";
  }
}

/* Guard that only allows specified roles (pure; no setState) */
function RequireRole({ allow = [], children }) {
  const location = useLocation();
  const role = getActiveRole();

  if (!role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!allow.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return children;
}

/* If already authed, don’t show login — go to role home */
function RedirectIfAuthed({ children }) {
  const location = useLocation();
  const role = getActiveRole();
  const dest = role ? homeForRole(role) : null;
  if (dest && dest !== location.pathname) return <Navigate to={dest} replace />;
  return children;
}

/* Root route -> send to user’s home (or login) */
function RootRedirect() {
  return <Navigate to={homeForRole(getActiveRole())} replace />;
}

/* ---------------- app ---------------- */
export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Login */}
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />

          {/* ===== TEACHER (admin area) ===== */}
          <Route
            path="/admin"
            element={
              <RequireRole allow={["TEACHER", "SUPER_ADMIN"]}>
                <TeacherDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/teacher"
            element={
              <RequireRole allow={["TEACHER", "SUPER_ADMIN"]}>
                <TeacherDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/admin/start-session"
            element={
              <RequireRole allow={["TEACHER"]}>
                <StartSessionPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/active-session/:id"
            element={
              <RequireRole allow={["TEACHER"]}>
                <ActiveSessionPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/students"
            element={
              <RequireRole allow={["TEACHER", "SUPER_ADMIN"]}>
                <TeacherStudentsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireRole allow={["TEACHER", "SUPER_ADMIN"]}>
                <TeacherReportsPage />
              </RequireRole>
            }
          />

          {/* ===== SUPER ADMIN ===== */}
          <Route
            path="/superadmin"
            element={
              <RequireRole allow={["SUPER_ADMIN"]}>
                <SuperAdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/superadmin/teachers"
            element={
              <RequireRole allow={["SUPER_ADMIN"]}>
                <TeacherListPage />
              </RequireRole>
            }
          />
          <Route
            path="/superadmin/teachers/new"
            element={
              <RequireRole allow={["SUPER_ADMIN"]}>
                <CreateTeacherPage />
              </RequireRole>
            }
          />
          <Route
            path="/superadmin/teachers/:id"
            element={
              <RequireRole allow={["SUPER_ADMIN"]}>
                <EditTeacherPage />
              </RequireRole>
            }
          />
          <Route
            path="/superadmin/live"
            element={
              <RequireRole allow={["SUPER_ADMIN"]}>
                <LiveSessionsPage />
              </RequireRole>
            }
          />
          <Route
            path="/superadmin/reports/active"
            element={
              <RequireRole allow={["SUPER_ADMIN"]}>
                <ReportsActiveSessionsPage />
              </RequireRole>
            }
          />
          <Route
            path="/superadmin/reports/students/:id"
            element={
              <RequireRole allow={["SUPER_ADMIN"]}>
                <ReportsStudentSummaryPage />
              </RequireRole>
            }
          />
          <Route
            path="/superadmin/students/:id/face-register"
            element={
              <RequireRole allow={["SUPER_ADMIN"]}>
                <FaceRegisterPage />
              </RequireRole>
            }
          />

          {/* ===== STUDENT ===== */}
          <Route
            path="/student"
            element={
              <RequireRole allow={["STUDENT"]}>
                <StudentDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/student/mark"
            element={
              <RequireRole allow={["STUDENT"]}>
                <MarkAttendancePage />
              </RequireRole>
            }
          />
          <Route
            path="/student/reports"
            element={
              <RequireRole allow={["STUDENT"]}>
                <StudentReportsPage />
              </RequireRole>
            }
          />
          {/* ✅ Protected Score page */}
          <Route
            path="/student/score"
            element={
              <RequireRole allow={["STUDENT"]}>
                <StudentScorePage />
              </RequireRole>
            }
          />

          {/* ===== COMMON: Change Password ===== */}
          <Route
            path="/change-password"
            element={
              <RequireRole allow={["SUPER_ADMIN", "TEACHER", "STUDENT"]}>
                <ChangePasswordPage />
              </RequireRole>
            }
          />

          {/* Root & catch-all */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toasts */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}
