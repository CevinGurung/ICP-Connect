import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { isLoggedIn } from "./auth/auth.js";
import "./App.css";

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />

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
              element={isLoggedIn() ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={isLoggedIn() ? <Navigate to="/" replace /> : <Register />}
            />

            {/* Example protected route if you add later */}
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div className="card">Protected Page</div>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
