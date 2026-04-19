import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { clearTokens, getRefreshToken, isLoggedIn } from "../auth/auth.js";
import { logout as logoutApi } from "../services/authService.js";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isLoggedIn();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  const handleLogout = async () => {
    try {
      const rt = getRefreshToken();
      if (rt) await logoutApi(rt);
    } catch {
      // ignore backend logout errors; still clear local session
    } finally {
      clearTokens();
      navigate("/login");
    }
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <img 
            src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8848"}/uploads/Logo.png`}
            alt="Logo" 
            className="navbar-logo" 
          />
          <span className="brand-text">ICP Connect</span>
          <span className="brand-dot" />
        </Link>

        {(!isAuthPage || loggedIn) && (
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
              Home
            </NavLink>

            {!loggedIn ? (
              <>
                <NavLink to="/login" className={({ isActive }) => (isActive ? "active" : "")}>
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Register
                </NavLink>
              </>
            ) : (
              <button className="btn btn-ghost" onClick={handleLogout} type="button">
                Logout
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
