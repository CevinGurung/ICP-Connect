import { useState, useEffect, useCallback } from "react";
import { Trash2, CheckCircle, EyeOff, ChevronLeft, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { getReports, resolveReport, deleteReportedPost } from "../services/adminService";
import AdminConfirmModal from "./components/AdminConfirmModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

const STATUSES = ["ALL", "PENDING", "RESOLVED", "IGNORED"];

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReportId, setActiveReportId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getReports(status, page)
      .then(setData)
      .catch(e => setError(e?.response?.data?.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (reportId, action) => {
    setActionLoading(`resolve-${reportId}`);
    try {
      await resolveReport(reportId, action);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || `Failed to ${action} report`);
    } finally {
      setActionLoading(null);
    }
  };

  const startDeletePost = (reportId) => {
    setActiveReportId(reportId);
    setModalOpen(true);
  };

  const executeDeletePost = async () => {
    if (!activeReportId) return;
    setModalOpen(false);
    setActionLoading(`delete-${activeReportId}`);
    try {
      await deleteReportedPost(activeReportId);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete post");
    } finally {
      setActionLoading(null);
    }
  };

  const reports = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Reports Management</h1>
          <p className="admin-page-subtitle">{data?.totalElements ?? 0} total reports filed</p>
        </div>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {STATUSES.map(s => (
          <button
            key={s}
            className={`btn-admin ${status === s ? "btn-admin-primary" : "btn-admin-ghost"}`}
            onClick={() => { setStatus(s); setPage(0); }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="admin-empty">No reports matching your filter.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reported Post</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Status</th>
                  <th>Filed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="post-preview-box">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div className="user-avatar-tiny" style={{ border: !r.postAuthorPic ? "1px solid #21262D" : "none" }}>
                            {r.postAuthorPic 
                              ? <img src={`${API_BASE}${r.postAuthorPic}`} alt="" />
                              : r.postAuthorName?.[0]}
                          </div>
                          <div className="author-sm">By {r.postAuthorName}</div>
                        </div>
                        <div className="content-sm">{r.postContent}</div>
                        <div className="id-sm">Post ID: {r.postId}</div>
                      </div>
                    </td>
                    <td>
                      <div className="reason-text">
                        <AlertCircle size={14} className="text-orange" />
                        {r.reason}
                      </div>
                    </td>
                    <td>
                      <div className="reporter-info" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="user-avatar-tiny" style={{ border: !r.reportedByPic ? "1px solid #21262D" : "none" }}>
                          {r.reportedByPic 
                            ? <img src={`${API_BASE}${r.reportedByPic}`} alt="" />
                            : r.reportedByName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.reportedByName}</div>
                          <div style={{ fontSize: 11, color: "#8B949E" }}>{r.reportedByEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ color: "#8B949E" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} />
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {r.status === "PENDING" && (
                          <>
                            <button 
                              className="btn-admin btn-admin-danger"
                              onClick={() => startDeletePost(r.id)}
                              disabled={actionLoading === `delete-${r.id}`}
                              title="Delete post & Resolve"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button 
                              className="btn-admin btn-admin-primary"
                              onClick={() => handleAction(r.id, "RESOLVED")}
                              disabled={actionLoading === `resolve-${r.id}`}
                              title="Resolve without deleting"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button 
                              className="btn-admin btn-admin-ghost"
                              onClick={() => handleAction(r.id, "IGNORED")}
                              disabled={actionLoading === `resolve-${r.id}`}
                              title="Ignore report"
                            >
                              <EyeOff size={14} />
                            </button>
                          </>
                        )}
                        {r.status !== "PENDING" && (
                          <span style={{ fontSize: 11, color: "#8B949E" }}>No further actions</span>
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

      <AdminConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={executeDeletePost}
        title="Delete Reported Post"
        message="Are you sure you want to delete this reported post? This will remove the post and mark this report as RESOLVED."
        confirmText="Delete & Resolve"
        type="danger"
        icon={Trash2}
      />

      <style>{`
        .post-preview-box {
          background: #0D1117;
          border: 1px solid #30363D;
          border-radius: 6px;
          padding: 8px 12px;
          max-width: 280px;
        }
        .author-sm { font-size: 11px; font-weight: 700; color: #58A6FF; margin-bottom: 2px; }
        .content-sm { font-size: 12px; color: #C9D1D9; word-break: break-word; line-height: 1.4; }
        .id-sm { font-size: 10px; color: #8B949E; margin-top: 4px; border-top: 1px solid #21262D; padding-top: 2px; }
        
        .reason-text {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #E6EDF3;
          max-width: 200px;
        }
        .text-orange { color: #f0883e; flex-shrink: 0; margin-top: 2px; }
        .reporter-info { font-size: 13px; }
        .user-avatar-tiny {
          width: 20px; height: 20px; border-radius: 50%; background: #30363D;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #58A6FF; overflow: hidden; flex-shrink: 0;
        }
        .user-avatar-tiny img { width: 100%; height: 100%; object-fit: cover; }
      `}</style>
    </div>
  );
}
