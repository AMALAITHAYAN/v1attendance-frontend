import { Navigate, useLocation } from "react-router-dom";

export default function RequireRole({ allow = [], children }) {
  const location = useLocation();
  const role = (localStorage.getItem("attendance:lastRole") || "").toUpperCase();

  if (!role) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!allow.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
