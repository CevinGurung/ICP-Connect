import { useState, useEffect } from "react";
import { Users, FileText, Flag, DollarSign, TrendingUp, UserPlus, Activity, AlertTriangle } from "lucide-react";
import { getDashboard } from "../services/adminService";

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="stat-icon" style={{ color: accent, background: accent + "18" }}>{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value ?? "—"}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading dashboard...</div>;
  if (!stats) return <div className="admin-empty">Failed to load dashboard stats.</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Your system overview at a glance</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <StatCard icon={<Users size={20} />}     label="Total Users"     value={stats.totalUsers}      sub={`+${stats.newUsersToday} today`}   accent="#58A6FF" />
        <StatCard icon={<FileText size={20} />}   label="Total Posts"     value={stats.totalPosts}      sub={`+${stats.newPostsToday} today`}   accent="#3FB950" />
        <StatCard icon={<Activity size={20} />}   label="Total Comments"  value={stats.totalComments}   accent="#D2A8FF" />
        <StatCard icon={<Flag size={20} />}       label="Reports"         value={stats.totalReports}    sub={`${stats.pendingReports} pending`} accent="#F0883E" />
        <StatCard icon={<DollarSign size={20} />} label="Donations"       value={`Rs. ${stats.totalDonationAmount ?? 0}`} sub={`${stats.totalDonations} successful`} accent="#D29922" />
        <StatCard icon={<UserPlus size={20} />}   label="Students"        value={stats.totalStudents}   accent="#58A6FF" />
        <StatCard icon={<TrendingUp size={20} />} label="Teachers"        value={stats.totalTeachers}   accent="#3FB950" />
        <StatCard icon={<AlertTriangle size={20} />} label="Admins"       value={stats.totalAdmins}     accent="#F85149" />
      </div>

      {/* Quick summary bar */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#8B949E", fontWeight: 600 }}>SYSTEM SUMMARY</h3>
        <div className="summary-rows">
          <div className="summary-row">
            <span>Total registered users</span>
            <strong>{stats.totalUsers}</strong>
          </div>
          <div className="summary-row">
            <span>Active posts in feed</span>
            <strong>{stats.totalPosts}</strong>
          </div>
          <div className="summary-row">
            <span>Pending reports awaiting review</span>
            <strong style={{ color: stats.pendingReports > 0 ? "#F0883E" : "#3FB950" }}>{stats.pendingReports}</strong>
          </div>
          <div className="summary-row">
            <span>Total donation revenue (NPR)</span>
            <strong style={{ color: "#D29922" }}>Rs. {stats.totalDonationAmount ?? 0}</strong>
          </div>
          <div className="summary-row">
            <span>New users joined today</span>
            <strong>{stats.newUsersToday}</strong>
          </div>
          <div className="summary-row" style={{ border: "none" }}>
            <span>Posts published today</span>
            <strong>{stats.newPostsToday}</strong>
          </div>
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .stat-card {
          background: #161B22;
          border: 1px solid #21262D;
          border-radius: 10px;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
        .stat-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .stat-value { font-size: 22px; font-weight: 700; color: #E6EDF3; }
        .stat-label { font-size: 12px; color: #8B949E; margin-top: 2px; font-weight: 500; }
        .stat-sub { font-size: 11px; color: #58A6FF; margin-top: 4px; }

        .summary-rows { display: flex; flex-direction: column; }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #21262D;
          font-size: 13px;
          color: #8B949E;
        }
        .summary-row strong { color: #E6EDF3; font-weight: 600; }
      `}</style>
    </div>
  );
}
