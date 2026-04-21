import { useState, useEffect } from "react";
import { BarChart, Users, FileText, Heart, TrendingUp } from "lucide-react";
import { getAnalytics } from "../services/adminService";

function Bar({ value, max, label, color }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="analytics-bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-container">
        <div className="bar-fill" style={{ width: `${percentage}%`, background: color }}>
          {value > 0 && <span className="bar-value">{value}</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(e => setError(e?.response?.data?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading analytics...</div>;
  if (!data) return <div className="admin-empty">No analytics data available.</div>;

  const maxPosts = Math.max(...data.postsPerDay.map(d => d.count), 1);
  const maxDonationsCount = Math.max(...data.donationsPerDay.map(d => d.count), 1);
  const totalUsers = Object.values(data.usersByRole).reduce((a, b) => a + b, 0);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Basic Analytics</h1>
          <p className="admin-page-subtitle">Growth and engagement metrics (Last 7 days)</p>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Posts per day */}
        <div className="admin-card">
          <div className="card-header-sm">
            <FileText size={16} /> <span>POSTS PUBLISHED (DAILY)</span>
          </div>
          <div className="bar-chart-v">
            {data.postsPerDay.map((d, i) => (
              <div key={i} className="v-bar-col">
                <div className="v-bar-fill-wrap">
                  <div 
                    className="v-bar-fill" 
                    style={{ height: `${(d.count / maxPosts) * 100}%`, background: "#3FB950" }}
                  >
                    <span className="v-bar-tooltip">{d.count}</span>
                  </div>
                </div>
                <div className="v-bar-label">{d.day.split('-').slice(1).join('/')}</div>
              </div>
            ))}
            {data.postsPerDay.length === 0 && <div className="admin-empty-sm">No post data for last 7 days.</div>}
          </div>
        </div>

        {/* User Role Distribution */}
        <div className="admin-card">
          <div className="card-header-sm">
            <Users size={16} /> <span>USER DISTRIBUTION</span>
          </div>
          <div className="distribution-list">
            <Bar label="Students" value={data.usersByRole.STUDENT || 0} max={totalUsers} color="#58A6FF" />
            <Bar label="Teachers" value={data.usersByRole.TEACHER || 0} max={totalUsers} color="#D29922" />
            <Bar label="Admins" value={data.usersByRole.ADMIN || 0} max={totalUsers} color="#F85149" />
          </div>
          <div className="total-stat-box">
            <div className="stat-num">{totalUsers}</div>
            <div className="stat-lbl">Total Registered Users</div>
          </div>
        </div>

        {/* Donations per day */}
        <div className="admin-card" style={{ gridColumn: "span 1" }}>
          <div className="card-header-sm">
            <Heart size={16} /> <span>DONATIONS COUNT (DAILY)</span>
          </div>
          <div className="bar-chart-v">
            {data.donationsPerDay.map((d, i) => (
              <div key={i} className="v-bar-col">
                <div className="v-bar-fill-wrap">
                  <div 
                    className="v-bar-fill" 
                    style={{ height: `${(d.count / maxDonationsCount) * 100}%`, background: "#F0883E" }}
                  >
                    <span className="v-bar-tooltip">{d.count}</span>
                  </div>
                </div>
                <div className="v-bar-label">{d.day.split('-').slice(1).join('/')}</div>
              </div>
            ))}
             {data.donationsPerDay.length === 0 && <div className="admin-empty-sm">No donation data.</div>}
          </div>
        </div>

         {/* Growth Trend */}
         <div className="admin-card">
          <div className="card-header-sm">
            <TrendingUp size={16} /> <span>ENGAGEMENT CONTEXT</span>
          </div>
          <div className="context-list">
            <div className="context-item">
              <span className="dot" style={{ background: "#3FB950" }}></span>
              <div className="ctx-info">
                <div className="ctx-lbl">Content Velocity</div>
                <div className="ctx-desc">Average of {(data.postsPerDay.reduce((a,b)=>a+b.count, 0)/7).toFixed(1)} posts per day</div>
              </div>
            </div>
            <div className="context-item">
              <span className="dot" style={{ background: "#58A6FF" }}></span>
              <div className="ctx-info">
                <div className="ctx-lbl">User Base</div>
                <div className="ctx-desc">{((data.usersByRole.STUDENT || 0) / totalUsers * 100).toFixed(0)}% are students</div>
              </div>
            </div>
            <div className="context-item">
              <span className="dot" style={{ background: "#F0883E" }}></span>
              <div className="ctx-info">
                <div className="ctx-lbl">Revenue Support</div>
                <div className="ctx-desc">Successful donations made: {data.donationsPerDay.reduce((a,b)=>a+b.count, 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .analytics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
        .card-header-sm { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700; color: #8B949E; margin-bottom: 24px; border-bottom: 1px solid #21262D; padding-bottom: 8px; }
        
        /* Vertical bar chart */
        .bar-chart-v { display: flex; height: 180px; align-items: flex-end; gap: 12px; margin-top: 10px; }
        .v-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
        .v-bar-fill-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; position: relative; }
        .v-bar-fill { width: 30px; border-radius: 4px 4px 0 0; position: relative; transition: height 0.6s ease; }
        .v-bar-tooltip { position: absolute; top: -24px; left: 50%; transform: translateX(-50%); font-size: 10px; background: #010409; color: #E6EDF3; padding: 2px 6px; border-radius: 4px; border: 1px solid #30363D; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
        .v-bar-fill:hover .v-bar-tooltip { opacity: 1; }
        .v-bar-label { font-size: 10px; color: #8B949E; margin-top: 8px; }

        /* Horizontal distribution bar */
        .distribution-list { display: flex; flex-direction: column; gap: 16px; }
        .analytics-bar-row { display: flex; flex-direction: column; gap: 6px; }
        .bar-label { font-size: 12px; color: #C9D1D9; }
        .bar-container { height: 8px; background: #21262D; border-radius: 4px; overflow: visible; }
        .bar-fill { height: 100%; border-radius: 4px; position: relative; transition: width 0.6s ease; }
        .bar-value { position: absolute; right: 0; top: -18px; font-size: 11px; font-weight: 700; color: #E6EDF3; }

        .total-stat-box { margin-top: 32px; text-align: center; padding: 20px; border-radius: 10px; background: rgba(88, 166, 255, 0.05); }
        .stat-num { font-size: 32px; font-weight: 800; color: #58A6FF; }
        .stat-lbl { font-size: 11px; color: #8B949E; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

        .context-list { display: flex; flex-direction: column; gap: 16px; }
        .context-item { display: flex; gap: 12px; align-items: flex-start; }
        .context-item .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
        .ctx-lbl { font-size: 13px; font-weight: 600; color: #E6EDF3; }
        .ctx-desc { font-size: 11px; color: #8B949E; margin-top: 2px; }
        .admin-empty-sm { font-size: 12px; color: #8B949E; font-style: italic; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; }
      `}</style>
    </div>
  );
}
