import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getRecommendations, toggleFollow } from "../services/userService";
import { getUserInfo } from "../auth/auth";
import { useNotification } from "../App";
import { Users, UserPlus, UserCheck, MapPin, GraduationCap, Info } from "lucide-react";
import FollowButton from "../components/FollowButton";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

export default function Connections() {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const fetchUsers = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await getRecommendations(pageNum, 9);
      if (data.length < 9) setHasMore(false);
      setUsers(prev => pageNum === 0 ? data : [...prev, ...data]);
      setPage(pageNum);
    } catch (err) {
      showToast("error", "Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, [loading, showToast]);

  useEffect(() => {
    fetchUsers(0);
  }, []);

  const lastUserElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchUsers(page + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchUsers, page]);

  const handleFollowToggle = async (userId) => {
    try {
      const result = await toggleFollow(userId);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isFollowing: result.isFollowing } : u
      ));
      showToast("success", result.isFollowing ? "Following user" : "Unfollowed user");
    } catch (err) {
      showToast("error", "Action failed");
    }
  };

  const getRandomGradient = (seed) => {
    const gradients = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #2af598 0%, #009efd 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    ];
    return gradients[seed % gradients.length];
  };

  return (
    <div className="connections-page container">
      <div className="connections-header">
        <div className="header-content">
          <h1>Grow your network</h1>
          <p>Connect with classmates from your program and year</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <Users size={20} />
            <span>Discovering students matching your profile</span>
          </div>
        </div>
      </div>

      <div className="connections-grid">
        {users.map((user, index) => {
          const isLastElement = users.length === index + 1;
          return (
            <div 
              key={user.id} 
              ref={isLastElement ? lastUserElementRef : null}
              className="connection-card"
            >
              <div 
                className="card-banner" 
                style={{ background: getRandomGradient(user.id) }}
              ></div>
              
              <div className="card-content">
                <div className="avatar-wrapper" onClick={() => navigate(`/profile/${user.id}`)}>
                  <div className="connection-avatar">
                    {user.profileImageUrl ? (
                      <img 
                        src={`${API_BASE}${user.profileImageUrl}`} 
                        alt={user.fullName} 
                        loading="lazy" 
                      />
                    ) : (
                      <span className="pfp-placeholder">{user.fullName[0]}</span>
                    )}
                  </div>
                </div>

                <div className="user-info" onClick={() => navigate(`/profile/${user.id}`)}>
                  <h3 className="user-name">{user.fullName}</h3>
                  <span className="user-username">@{user.userName}</span>
                  
                  <div className="academic-badge">
                    <GraduationCap size={14} />
                    <span>{user.year} Year · {user.program}</span>
                  </div>
                  
                  <div className="section-tag">
                    <Info size={12} />
                    <span>Section {user.section || 'N/A'}</span>
                  </div>

                  {user.bio && (
                    <p className="user-bio">{user.bio}</p>
                  )}
                </div>

                <div className="card-footer">
                  <FollowButton
                    isFollowing={user.isFollowing}
                    isFollowedBy={user.isFollowedBy}
                    onToggle={() => handleFollowToggle(user.id)}
                    size="md"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Finding more classmates...</span>
        </div>
      )}

      {!hasMore && users.length > 0 && (
        <div className="end-state">
          <p>You've seen everyone! Try refreshing later.</p>
        </div>
      )}

      <style>{`
        .connections-page { padding: 40px 20px; max-width: 1100px; margin: 0 auto; color: var(--text-primary); }
        .connections-header { margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--border); padding-bottom: 24px; }
        .connections-header h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; color: var(--text-primary); }
        .connections-header p { font-size: 16px; color: var(--text-secondary); margin: 0; }
        .header-stats { display: flex; gap: 24px; }
        .stat-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--primary); background: rgba(88, 166, 255, 0.1); padding: 8px 16px; border-radius: 20px; }

        .connections-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 24px; 
        }

        .connection-card { 
          background: var(--card); 
          border: 1px solid var(--border); 
          border-radius: 12px; 
          overflow: hidden; 
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }
        .connection-card:hover { 
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
          border-color: var(--primary);
        }

        .card-banner { height: 80px; width: 100%; }
        .card-content { padding: 0 20px 24px; position: relative; flex: 1; display: flex; flex-direction: column; }
        
        .avatar-wrapper { 
          margin-top: -40px; 
          margin-bottom: 12px; 
          display: inline-block; 
          cursor: pointer; 
        }
        .connection-avatar { 
          width: 80px; 
          height: 80px; 
          border-radius: 50%; 
          border: 4px solid var(--card); 
          overflow: hidden; 
          background: #38434F;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .pfp-placeholder { font-size: 32px; font-weight: bold; color: var(--primary); }

        .user-info { cursor: pointer; flex: 1; }
        .user-name { font-size: 18px; font-weight: 700; margin: 0; color: var(--text-primary); }
        .user-username { font-size: 14px; color: var(--text-muted); display: block; margin-bottom: 12px; }

        .academic-badge { 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          font-size: 13px; 
          color: var(--text-primary); 
          font-weight: 600;
          margin-bottom: 4px;
        }
        .section-tag {
          display: flex; 
          align-items: center; 
          gap: 6px; 
          font-size: 11px; 
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .user-bio { 
          font-size: 13px; 
          line-height: 1.5; 
          color: var(--text-secondary); 
          margin: 12px 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-footer { margin-top: auto; padding-top: 16px; }
        .btn-connect { 
          width: 100%; 
          padding: 10px; 
          border-radius: 20px; 
          border: 1px solid var(--primary); 
          background: transparent; 
          color: var(--primary);
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-connect:hover { background: rgba(88, 166, 255, 0.1); }
        .btn-connect.following { 
          background: var(--primary); 
          color: white; 
        }

        .loading-state { padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--text-muted); }
        .end-state { padding: 60px; text-align: center; color: var(--text-muted); font-style: italic; }

        @media (max-width: 992px) { .connections-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { 
          .connections-grid { grid-template-columns: 1fr; }
          .connections-header { flex-direction: column; align-items: flex-start; gap: 16px; }
        }
      `}</style>
    </div>
  );
}
