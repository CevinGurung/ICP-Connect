import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, Users, FileText, Flag, DollarSign, 
  Activity, BarChart2, LogOut, Shield, Home
} from "lucide-react";
import { clearTokens } from "../auth/auth.js";

const navItems = [
  { to: "/admin",            label: "Dashboard",    icon: <LayoutDashboard size={18} />, exact: true },
  { to: "/admin/users",      label: "Users",        icon: <Users size={18} /> },
  { to: "/admin/posts",      label: "Posts",        icon: <FileText size={18} /> },
  { to: "/admin/reports",    label: "Reports",      icon: <Flag size={18} /> },
  { to: "/admin/donations",  label: "Donations",    icon: <DollarSign size={18} /> },
  { to: "/admin/activity",   label: "Activity",     icon: <Activity size={18} /> },
  { to: "/admin/analytics",  label: "Analytics",    icon: <BarChart2 size={18} /> },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearTokens();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Shield size={22} className="brand-icon" />
          <span>Admin Panel</span>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item" style={{ marginBottom: 4, color: '#3FB950' }}>
            <Home size={18} />
            <span>Visit Site</span>
          </Link>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>

      <style>{`
        .admin-shell {
          display: flex;
          height: 100vh;
          background: #0D1117;
          color: #E6EDF3;
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
        }

        .admin-sidebar {
          width: 240px;
          min-width: 240px;
          background: #010409;
          border-right: 1px solid #21262D;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }

        .admin-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 20px;
          font-size: 16px;
          font-weight: 700;
          border-bottom: 1px solid #21262D;
          color: #E6EDF3;
        }

        .brand-icon { color: #58A6FF; }

        .admin-nav {
          flex: 1;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }

        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #8B949E;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .admin-nav-item:hover {
          background: #161B22;
          color: #E6EDF3;
        }

        .admin-nav-item.active {
          background: rgba(88, 166, 255, 0.1);
          color: #58A6FF;
          border: 1px solid rgba(88, 166, 255, 0.2);
        }

        .admin-nav-item.active:hover { opacity: 0.9; }

        .admin-sidebar-footer {
          padding: 12px 8px;
          border-top: 1px solid #21262D;
        }

        .admin-logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          background: transparent;
          border: none;
          color: #F85149;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .admin-logout-btn:hover {
          background: rgba(248, 81, 73, 0.1);
        }

        .admin-main {
          flex: 1;
          overflow-y: auto;
          background: #0D1117;
        }

        /* Shared admin page styles */
        .admin-page { padding: 28px 32px; }
        .admin-page-header { 
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .admin-page-title {
          font-size: 22px;
          font-weight: 700;
          color: #E6EDF3;
          margin: 0;
        }
        .admin-page-subtitle {
          font-size: 13px;
          color: #8B949E;
          margin: 4px 0 0;
        }

        .admin-card {
          background: #161B22;
          border: 1px solid #21262D;
          border-radius: 10px;
          padding: 20px;
        }

        .admin-table-wrap {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .admin-table th {
          text-align: left;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 600;
          color: #8B949E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #21262D;
        }

        .admin-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #161B22;
          color: #C9D1D9;
          vertical-align: middle;
        }

        .admin-table tr:hover td { background: rgba(255,255,255,0.02); }
        .admin-table tr:last-child td { border-bottom: none; }

        .role-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-student { background: rgba(63, 185, 80, 0.12); color: #3FB950; border: 1px solid rgba(63, 185, 80, 0.25); }
        .badge-teacher { background: rgba(210, 153, 34, 0.12); color: #D29922; border: 1px solid rgba(210, 153, 34, 0.25); }
        .badge-admin   { background: rgba(88, 166, 255, 0.12); color: #58A6FF; border: 1px solid rgba(88, 166, 255, 0.25); }

        .status-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-pending  { background: rgba(210, 153, 34, 0.12); color: #D29922; border: 1px solid rgba(210, 153, 34, 0.25); }
        .status-resolved { background: rgba(63, 185, 80, 0.12); color: #3FB950; border: 1px solid rgba(63, 185, 80, 0.25); }
        .status-ignored  { background: rgba(139, 148, 158, 0.12); color: #8B949E; border: 1px solid rgba(139, 148, 158, 0.25); }
        .status-completed { background: rgba(63, 185, 80, 0.12); color: #3FB950; border: 1px solid rgba(63, 185, 80, 0.25); }
        .status-pending-don { background: rgba(210, 153, 34, 0.12); color: #D29922; border: 1px solid rgba(210, 153, 34, 0.25); }

        .btn-admin {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-admin-primary { background: #238636; color: #fff; }
        .btn-admin-primary:hover { background: #2EA043; }
        .btn-admin-danger { background: rgba(248, 81, 73, 0.15); color: #F85149; border: 1px solid rgba(248, 81, 73, 0.3); }
        .btn-admin-danger:hover { background: rgba(248, 81, 73, 0.25); }
        .btn-admin-ghost { background: rgba(255,255,255,0.05); color: #8B949E; border: 1px solid #30363D; }
        .btn-admin-ghost:hover { background: rgba(255,255,255,0.08); color: #E6EDF3; }
        .btn-admin-yellow { background: rgba(210, 153, 34, 0.15); color: #D29922; border: 1px solid rgba(210, 153, 34, 0.3); }
        .btn-admin-yellow:hover { background: rgba(210, 153, 34, 0.25); }

        .admin-input {
          background: #0D1117;
          border: 1px solid #30363D;
          border-radius: 6px;
          padding: 8px 12px;
          color: #E6EDF3;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .admin-input:focus { border-color: #58A6FF; }

        .admin-select {
          background: #0D1117;
          border: 1px solid #30363D;
          border-radius: 6px;
          padding: 8px 12px;
          color: #E6EDF3;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }

        .admin-pagination {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          justify-content: flex-end;
        }
        .page-info { font-size: 12px; color: #8B949E; }

        .admin-loading { 
          display: flex; justify-content: center; align-items: center; 
          padding: 60px; color: #8B949E;
        }
        .admin-empty { 
          text-align: center; padding: 48px; color: #8B949E; font-size: 14px;
        }

        @media (max-width: 768px) {
          .admin-sidebar { width: 60px; min-width: 60px; }
          .admin-sidebar .admin-brand span,
          .admin-sidebar .admin-nav-item span,
          .admin-sidebar .admin-logout-btn span { display: none; }
          .admin-brand { justify-content: center; padding: 20px 8px; }
          .admin-nav-item { justify-content: center; padding: 10px 8px; }
          .admin-logout-btn { justify-content: center; padding: 10px 8px; }
          .admin-page { padding: 16px; }
        }
      `}</style>
    </div>
  );
}
