import { useState, useEffect } from "react";
import { Flag, UserPlus, Heart, Clock, RefreshCw } from "lucide-react";
import { getActivity } from "../services/adminService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

export default function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getActivity()
      .then(setActivities)
      .catch(e => setError(e?.response?.data?.message || "Failed to load activity feed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getIcon = (type) => {
    switch (type) {
      case "REPORT": return <Flag size={14} className="text-orange" />;
      case "JOIN": return <UserPlus size={14} className="text-blue" />;
      case "DONATION": return <Heart size={14} className="text-pink" />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Activity Feed</h1>
          <p className="admin-page-subtitle">Real-time overview of system actions</p>
        </div>
        <button className="btn-admin btn-admin-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      <div className="admin-card">
        {loading && activities.length === 0 ? (
          <div className="admin-loading">Loading updates...</div>
        ) : activities.length === 0 ? (
          <div className="admin-empty">No recent activity detected.</div>
        ) : (
          <div className="activity-list">
            {activities.map((act, idx) => (
              <div key={idx} className="activity-item">
                <div className={`activity-icon-wrap icon-${act.type.toLowerCase()}`}>
                  {act.actorPic 
                    ? <img src={`${API_BASE}${act.actorPic}`} alt="" className="actor-pic" />
                    : getIcon(act.type)}
                </div>
                <div className="activity-content">
                  <div className="activity-desc">{act.description}</div>
                  <div className="activity-meta">
                    <span className="activity-time">{new Date(act.timestamp).toLocaleString()}</span>
                    <span className="dot">•</span>
                    <span className="activity-actor">{act.actorEmail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .activity-list { display: flex; flex-direction: column; }
        .activity-item {
          display: flex; gap: 16px; padding: 16px 0;
          border-bottom: 1px solid #21262D;
        }
        .activity-item:last-child { border-bottom: none; }
        
        .activity-icon-wrap {
          width: 32px; height: 32px; border-radius: 50%; background: #21262D;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .icon-report { background: rgba(240, 136, 62, 0.15); }
        .icon-join { background: rgba(88, 166, 255, 0.15); }
        .icon-donation { background: rgba(248, 81, 73, 0.15); }
        
        .actor-pic { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        
        .text-orange { color: #f0883e; }
        .text-blue { color: #58a6ff; }
        .text-pink { color: #f85149; }
        
        .activity-content { display: flex; flex-direction: column; gap: 4px; }
        .activity-desc { font-size: 14px; color: #E6EDF3; font-weight: 500; }
        .activity-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #8B949E; }
        .dot { font-size: 14px; color: #30363D; }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
