import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, createContext, useContext, useCallback, useMemo } from "react";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { ToastContainer } from "./components/Toast.jsx";
import { isLoggedIn } from "./auth/auth.js";
import "./App.css";

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notificationValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <NotificationContext.Provider value={notificationValue}>
      <Router>
        <div className="app-shell">
          <Navbar />
          <ToastContainer toasts={toasts} removeToast={removeToast} />

          <main className="app-main">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </NotificationContext.Provider>
  );
}
