import { useState, useEffect, useCallback } from "react";
import { Trash2, ExternalLink, ChevronLeft, ChevronRight, MessageSquare, ThumbsUp } from "lucide-react";
import { getPosts, deletePost } from "../services/adminService";
import AdminConfirmModal from "./components/AdminConfirmModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

export default function AdminPosts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getPosts(page)
      .then(setData)
      .catch(e => setError(e?.response?.data?.message || "Failed to load posts"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const startDelete = (postId) => {
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedPostId) return;
    setModalOpen(false);
    setActionLoading(selectedPostId);
    try {
      await deletePost(selectedPostId);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete post");
      setActionLoading(null);
    }
  };

  const posts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Post Moderation</h1>
          <p className="admin-page-subtitle">{data?.totalElements ?? 0} total active posts</p>
        </div>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="admin-empty">No posts found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Post Info</th>
                  <th>Author</th>
                  <th>Engagement</th>
                  <th>Media</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="post-content-preview">
                        {p.content || <span className="muted italic" style={{ opacity: 0.5 }}>No text content</span>}
                      </div>
                      <div className="post-id text-muted">ID: {p.id}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="user-avatar-mini" style={{ border: !p.authorProfilePic ? "1px solid #30363D" : "none" }}>
                          {p.authorProfilePic
                            ? <img src={`${API_BASE}${p.authorProfilePic}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : p.authorName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.authorName}</div>
                          <div style={{ fontSize: 11, color: "#8B949E" }}>{p.authorEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="engagement-stats">
                        <span title="Likes"><ThumbsUp size={14} /> {p.likeCount}</span>
                        <span title="Comments"><MessageSquare size={14} /> {p.commentCount}</span>
                      </div>
                    </td>
                    <td>
                      {p.mediaCount > 0 ? (
                        <span className="media-badge">{p.mediaCount} files</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td style={{ color: "#8B949E" }}>
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a 
                          href={`/post/${p.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-admin btn-admin-ghost"
                          title="View Post"
                        >
                          <ExternalLink size={14} /> View Post
                        </a>
                        <button 
                          className="btn-admin btn-admin-danger"
                          onClick={() => startDelete(p.id)}
                          disabled={actionLoading === p.id}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
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
        onConfirm={executeDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone and will remove it for all users."
        confirmText="Delete Post"
        type="danger"
        icon={Trash2}
      />

      <style>{`
        .post-content-preview {
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
          color: #E6EDF3;
        }
        .post-id { font-size: 11px; margin-top: 4px; }
        .engagement-stats { display: flex; gap: 12px; color: #8B949E; }
        .engagement-stats span { display: flex; align-items: center; gap: 4px; }
        .media-badge {
          background: rgba(88, 166, 255, 0.1);
          color: #58A6FF;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          border: 1px solid rgba(88, 166, 255, 0.2);
        }
        .user-avatar-mini {
          width: 30px; height: 30px; border-radius: 50%; background: #30363D;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #58A6FF; overflow: hidden; flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
}
