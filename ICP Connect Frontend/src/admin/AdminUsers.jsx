import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Trash2, Shield } from "lucide-react";
import { getUsers, updateUserRole, deleteUser } from "../services/adminService";
import AdminConfirmModal from "./components/AdminConfirmModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

const ROLES = ["ALL", "STUDENT", "TEACHER", "ADMIN"];

function roleBadgeClass(role) {
  if (role === "TEACHER") return "role-badge badge-teacher";
  if (role === "ADMIN") return "role-badge badge-admin";
  return "role-badge badge-student";
}

export default function AdminUsers() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getUsers(role, search, page)
      .then(setData)
      .catch(e => setError(e?.response?.data?.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, [role, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const startRoleChange = (userId, newRole, name) => {
    if (newRole === "ADMIN") {
      setModalConfig({
        title: "Promote to Admin",
        message: `Are you sure you want to promote "${name}" to Administrator? They will have full control over the system.`,
        confirmText: "Promote",
        type: "primary",
        icon: Shield,
        onConfirm: () => executeRoleChange(userId, newRole)
      });
      setModalOpen(true);
    } else {
      executeRoleChange(userId, newRole);
    }
  };

  const executeRoleChange = async (userId, newRole) => {
    setActionLoading(`role-${userId}`);
    setError("");
    setModalOpen(false);
    try {
      await updateUserRole(userId, newRole);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const startDelete = (userId, name) => {
    setModalConfig({
      title: "Deactivate User",
      message: `Deactivate account for "${name}"? They will no longer be able to log in.`,
      confirmText: "Deactivate",
      type: "danger",
      icon: Trash2,
      onConfirm: () => executeDelete(userId)
    });
    setModalOpen(true);
  };

  const executeDelete = async (userId) => {
    setActionLoading(`del-${userId}`);
    setError("");
    setModalOpen(false);
    try {
      await deleteUser(userId);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to deactivate user");
    } finally {
      setActionLoading(null);
    }
  };

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">{data?.totalElements ?? 0} total users</p>
        </div>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1, minWidth: 240 }}>
            <input
              className="admin-input"
              style={{ flex: 1 }}
              placeholder="Search by name, email, or username..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn-admin btn-admin-primary">
              <Search size={14} /> Search
            </button>
          </form>

          <div style={{ display: "flex", gap: 6 }}>
            {ROLES.map(r => (
              <button
                key={r}
                className={`btn-admin ${role === r ? "btn-admin-primary" : "btn-admin-ghost"}`}
                onClick={() => { setRole(r); setPage(0); }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="admin-empty">No users found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Program / Year</th>
                  <th>Posts</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="user-avatar-mini" style={{ border: !u.profilePicUrl ? "1px solid #30363D" : "none" }}>
                          {u.profilePicUrl
                            ? <img src={`${API_BASE}${u.profilePicUrl}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : u.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: u.isActive ? "#E6EDF3" : "#8B949E" }}>
                            {u.fullName} {!u.isActive && <span style={{ fontSize: 10, opacity: 0.6 }}>(Disabled)</span>}
                          </div>
                          <div style={{ fontSize: 11, color: "#8B949E" }}>@{u.userName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#8B949E" }}>{u.email}</td>
                    <td><span className={roleBadgeClass(u.role)}>{u.role}</span></td>
                    <td style={{ color: "#8B949E" }}>{u.program || "—"} {u.year ? `Y${u.year}` : ""}</td>
                    <td>{u.postCount}</td>
                    <td style={{ color: "#8B949E" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {u.role !== "ADMIN" && (
                          <>
                            <button 
                              className="btn-admin btn-admin-primary"
                              disabled={actionLoading === `role-${u.id}`}
                              onClick={() => startRoleChange(u.id, "ADMIN", u.fullName)}
                              title="Promote to Admin"
                            >
                              <Shield size={12} /> Make Admin
                            </button>
                             <button 
                               className="btn-admin btn-admin-danger"
                               disabled={actionLoading === `del-${u.id}`}
                               onClick={() => startDelete(u.id, u.fullName)}
                               title="Deactivate User"
                             >
                               <Trash2 size={12} /> Delete
                             </button>
                          </>
                        )}
                        {u.role === "ADMIN" && (
                          <span style={{ fontSize: 11, color: "#8B949E", padding: "6px 0" }}>Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="admin-pagination">
            <button className="btn-admin btn-admin-ghost" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <ChevronLeft size={14} />
            </button>
            <span className="page-info">Page {page + 1} of {totalPages}</span>
            <button className="btn-admin btn-admin-ghost" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {modalConfig && (
        <AdminConfirmModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          {...modalConfig}
        />
      )}

      <style>{`
        .user-avatar-mini {
          width: 34px; height: 34px; border-radius: 50%; background: #30363D;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #58A6FF; overflow: hidden; flex-shrink: 0;
        }
        .admin-error-banner {
          background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.3);
          color: #F85149; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 13px;
        }
      `}</style>
    </div>
  );
}
