import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearTokens, getRefreshToken, isLoggedIn } from "../auth/auth.js";
import { logout as logoutApi } from "../services/authService.js";

export default function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

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
          ICP Connect
          <span className="brand-dot" />
        </Link>

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
      </div>
    </header>
  );
}
