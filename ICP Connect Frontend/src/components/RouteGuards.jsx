import { Navigate } from "react-router-dom";
import { isLoggedIn, getUserInfo } from "../auth/auth.js";

export function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const info = getUserInfo();
  // If normal user is trying to access admin pages, redirect to home
  if (info?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

export function PublicRoute({ children }) {
  if (isLoggedIn()) {
    const info = getUserInfo();
    return info?.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/" replace />;
  }
  return children;
}
