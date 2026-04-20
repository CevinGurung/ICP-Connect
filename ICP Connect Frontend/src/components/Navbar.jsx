import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { clearTokens, getRefreshToken, isLoggedIn } from "../auth/auth.js";
import { logout as logoutApi } from "../services/authService.js";
import { getUserInfo } from "../auth/auth.js";
import { 
  Home, 
  Users, 
  MessageSquare, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Search 
} from "lucide-react";

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

  const userInfo = getUserInfo();
  const currentUserId = userInfo?.userId;

  const navItems = [
    { to: "/", icon: <Home size={24} />, label: "Home" },
    { to: "/connections", icon: <Users size={24} />, label: "Connections" },
    { to: "/messages", icon: <MessageSquare size={24} />, label: "Message" },
    { to: "/notifications", icon: <Bell size={24} />, label: "Notification" },
    { to: currentUserId ? `/profile/${currentUserId}` : "/profile", icon: <UserIcon size={24} />, label: "Profile" },
  ];

  if (isAuthPage) return null;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <img 
              src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8848"}/uploads/Logo.png`}
              alt="Logo" 
              className="navbar-logo logo-glow" 
            />
            <span className="brand-text-refined">ICP Connect</span>
          </Link>
          
          {loggedIn && !isAuthPage && (
            <div className="navbar-search">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search" className="search-input" />
            </div>
          )}
        </div>

        {(!isAuthPage || loggedIn) && (
          <nav className="navbar-right">
            {loggedIn ? (
              <>
                {navItems.map((item) => (
                  <NavLink 
                    key={item.to} 
                    to={item.to} 
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    <span className="nav-item-label">{item.label}</span>
                  </NavLink>
                ))}
                
                <button className="nav-item btn-logout" onClick={handleLogout} title="Logout">
                  <LogOut size={24} />
                  <span className="nav-item-label">Logout</span>
                </button>
              </>
            ) : (
              <div className="nav-auth">
                <Link to="/login" className="btn btn-ghost">Login</Link>
                <Link to="/register" className="btn btn-primary">Join Now</Link>
              </div>
            )}
          </nav>
        )}
      </div>
      <style>{`
        .navbar {
          background: var(--card);
          border-bottom: 1px solid var(--border);
          height: var(--nav-height);
          position: sticky;
          top: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
        }
        .navbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .navbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .navbar-logo {
          height: 34px;
          width: 34px;
          border-radius: 6px;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .navbar-search {
          background: #38434F;
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          height: 34px;
          max-width: 280px;
          width: 100%;
        }
        .search-icon {
          color: var(--text-secondary);
        }
        .search-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          padding: 8px;
          width: 100%;
          outline: none;
          font-size: 14px;
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          text-decoration: none;
          min-width: 80px;
          height: var(--nav-height);
          position: relative;
          transition: color 0.2s;
          background: none;
          border: none;
          cursor: pointer;
        }
        .nav-item:hover {
          color: var(--text-primary);
        }
        .nav-item.active {
          color: var(--text-primary);
        }
        .nav-item.active::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--text-primary);
        }
        .nav-item-label {
          font-size: 12px;
          margin-top: 4px;
        }
        .btn-logout {
          border-left: 1px solid var(--border);
          margin-left: 12px;
          padding-left: 12px;
        }
        .nav-auth {
          display: flex;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .nav-item-label, .brand-text-refined {
            display: none;
          }
          .nav-item {
            min-width: 50px;
          }
          .navbar-search {
            max-width: 40px;
            padding: 0;
            justify-content: center;
          }
          .search-input {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
