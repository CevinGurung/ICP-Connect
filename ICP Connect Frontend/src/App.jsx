import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState, useCallback, useMemo } from "react";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentFailure from "./pages/PaymentFailure.jsx";
import { ToastContainer } from "./components/Toast.jsx";
import { isLoggedIn } from "./auth/auth.js";
import { NotificationContext } from "./context/NotificationContext.jsx";
import { ProtectedRoute, AdminRoute, PublicRoute } from "./components/RouteGuards.jsx";
import "./App.css";

const Connections = lazy(() => import("./pages/Connections.jsx"));
const Messages = lazy(() => import("./pages/Messages.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));

// Admin lazy imports
const AdminLayout = lazy(() => import("./admin/AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard.jsx"));
const AdminUsers = lazy(() => import("./admin/AdminUsers.jsx"));
const AdminPosts = lazy(() => import("./admin/AdminPosts.jsx"));
const AdminReports = lazy(() => import("./admin/AdminReports.jsx"));
const AdminDonations = lazy(() => import("./admin/AdminDonations.jsx"));
const AdminActivity = lazy(() => import("./admin/AdminActivity.jsx"));
const AdminAnalytics = lazy(() => import("./admin/AdminAnalytics.jsx"));

export default function App() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message) => {
    setToasts((prev) => {
      // Prevent multiple popoffs of same message/type if already visible
      const isDuplicate = prev.some(t => t.type === type && t.message === message);
      if (isDuplicate) return prev;
      
      const id = Date.now();
      return [...prev, { id, type, message }];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notificationValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <NotificationContext.Provider value={notificationValue}>
      <Router>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="spinner"></div>
          </div>
        }>
          <Routes>
            {/* ADMIN ROUTES (Isolated Layout) */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="donations" element={<AdminDonations />} />
              <Route path="activity" element={<AdminActivity />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            {/* PUBLIC AUTH ROUTES */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* USER ROUTES (Main Layout with Navbar) */}
            <Route path="*" element={
              <div className="app-shell">
                <Navbar />
                <main className="app-main">
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/post/:postId" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                    <Route path="/payment-failure" element={<ProtectedRoute><PaymentFailure /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            } />
          </Routes>
        </Suspense>
      </Router>
    </NotificationContext.Provider>
  );
}
