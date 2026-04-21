import { useState, useEffect, useCallback } from "react";
import { DollarSign, ChevronLeft, ChevronRight, MessageSquare, User, Calendar } from "lucide-react";
import { getDonations } from "../services/adminService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

export default function AdminDonations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getDonations(page)
      .then(setData)
      .catch(e => setError(e?.response?.data?.message || "Failed to load donations"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const donations = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Donation Monitoring</h1>
          <p className="admin-page-subtitle">{data?.totalElements ?? 0} successful donations received</p>
        </div>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">Loading donations...</div>
        ) : donations.length === 0 ? (
          <div className="admin-empty">No donations recorded yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Amount</th>
                  <th>Message</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="user-avatar-mini">
                          {d.donorPic 
                            ? <img src={`${API_BASE}${d.donorPic}`} alt="" />
                            : <User size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#E6EDF3" }}>{d.donorName}</div>
                          <div style={{ fontSize: 11, color: "#8B949E" }}>{d.donorEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="amount-text">Rs. {d.amount}</div>
                    </td>
                    <td>
                      {d.message ? (
                        <div className="donation-message">
                          <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{d.message}</span>
                        </div>
                      ) : (
                        <span className="text-muted italic">No message</span>
                      )}
                    </td>
                    <td style={{ color: "#8B949E" }}>{d.paymentMethod}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8B949E" }}>
                        <Calendar size={12} />
                        {new Date(d.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className="status-badge status-resolved">
                        {d.status}
                      </span>
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

      <style>{`
        .user-avatar-mini {
          width: 30px; height: 30px; border-radius: 50%; background: #21262D;
          display: flex; align-items: center; justify-content: center;
          color: #8B949E; overflow: hidden;
        }
        .user-avatar-mini img { width: 100%; height: 100%; object-fit: cover; }
        .amount-text { font-weight: 700; color: #3FB950; font-size: 14px; }
        .donation-message {
          display: flex; gap: 8px; font-size: 12px; color: #C9D1D9;
          max-width: 250px; line-height: 1.4;
          background: rgba(255,255,255,0.03); padding: 4px 8px; border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
