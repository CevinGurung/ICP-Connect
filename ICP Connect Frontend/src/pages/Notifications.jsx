import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAllAsRead, markAsRead } from "../services/notificationService";
import { toggleFollow } from "../services/userService";
import { getUserInfo } from "../auth/auth";
import FollowButton from "../components/FollowButton";
import { Heart, MessageCircle, UserPlus, Users, Bell, CheckCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
  return then.toLocaleDateString();
}

const TYPE_META = {
  LIKE: { icon: Heart, color: "#f85149", bg: "rgba(248,81,73,0.1)", label: "Like" },
  COMMENT: { icon: MessageCircle, color: "#58a6ff", bg: "rgba(88,166,255,0.1)", label: "Comment" },
  FOLLOW: { icon: UserPlus, color: "#d29922", bg: "rgba(210,153,34,0.1)", label: "Follow" },
  FOLLOW_BACK: { icon: Users, color: "#3fb950", bg: "rgba(63,185,80,0.1)", label: "Connection" },
};

export default function Notifications() {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const currentUserId = userInfo?.userId;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (pageNum = 0) => {
    try {
      setLoading(true);
      const data = await getNotifications(pageNum, 20);
      if (pageNum === 0) {
        setNotifications(data.content || []);
      } else {
        setNotifications((prev) => [...prev, ...(data.content || [])]);
      }
      setHasMore(!data.last);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto mark-all-as-read
  useEffect(() => {
    fetchNotifications(0);
    markAllAsRead().catch(() => {});
  }, [fetchNotifications]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNotifications(next);
  };

  const handleNotificationClick = (n) => {
    // Mark individual as read
    if (!n.isRead) {
      markAsRead(n.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
    }

    // Redirect based on type
    if ((n.type === "LIKE" || n.type === "COMMENT") && n.postId) {
      navigate(`/post/${n.postId}`);
    } else if (n.type === "FOLLOW" || n.type === "FOLLOW_BACK") {
      navigate(`/profile/${n.actorId}`);
    }
  };

  const handleFollowToggle = async (n) => {
    try {
      await toggleFollow(n.actorId);
      setNotifications((prev) =>
        prev.map((item) => {
          if (item.actorId === n.actorId) {
            return {
              ...item,
              isFollowing: !item.isFollowing,
            };
          }
          return item;
        })
      );
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Mark all as read failed:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <div className="notifications-page">
        <div className="notifications-container">
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-left">
              <div className="notif-header-icon">
                <Bell size={22} />
              </div>
              <h1 className="notif-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="notif-unread-badge">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={handleMarkAllRead}>
                <CheckCheck size={16} />
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-list">
            {notifications.length === 0 && !loading && (
              <div className="notif-empty">
                <Bell size={48} strokeWidth={1} />
                <p>No notifications yet</p>
                <span>When someone likes, comments, or follows you, it'll show up here.</span>
              </div>
            )}

            {notifications.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.LIKE;
              const IconComponent = meta.icon;
              const isFollowType = n.type === "FOLLOW" || n.type === "FOLLOW_BACK";
              const isOwnProfile = n.actorId === currentUserId;

              return (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  {/* Unread indicator */}
                  {!n.isRead && <div className="notif-unread-dot" style={{ background: meta.color }} />}

                  {/* Type icon */}
                  <div className="notif-type-icon" style={{ background: meta.bg }}>
                    <IconComponent size={18} color={meta.color} />
                  </div>

                  {/* Avatar */}
                  <div className="notif-avatar" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${n.actorId}`); }}>
                    {n.actorProfileImageUrl ? (
                      <img
                        src={`${API_BASE}${n.actorProfileImageUrl}`}
                        alt={n.actorName}
                        className="notif-avatar-img"
                      />
                    ) : (
                      <span className="notif-avatar-placeholder">
                        {n.actorName?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="notif-content">
                    <p className="notif-message">{n.message}</p>
                    <span className="notif-time">{timeAgo(n.createdAt)}</span>
                  </div>

                  {/* Follow button (only for follow-type notifications, not own profile) */}
                  {isFollowType && !isOwnProfile && (
                    <div className="notif-action" onClick={(e) => e.stopPropagation()}>
                      <FollowButton
                        isFollowing={n.isFollowing}
                        isFollowedBy={n.isFollowedBy}
                        onToggle={() => handleFollowToggle(n)}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="notif-loading">
                <div className="spinner" />
              </div>
            )}

            {!loading && hasMore && notifications.length > 0 && (
              <button className="notif-load-more" onClick={handleLoadMore}>
                Load more
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .notifications-page {
          max-width: 680px;
          margin: 0 auto;
          padding: 24px 16px;
          min-height: calc(100vh - var(--nav-height));
        }

        .notifications-container {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        /* Header */
        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(135deg, rgba(88,166,255,0.04) 0%, transparent 100%);
        }
        .notif-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .notif-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(88,166,255,0.15), rgba(124,58,237,0.15));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }
        .notif-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }
        .notif-unread-badge {
          background: linear-gradient(135deg, #f85149, #da3633);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          letter-spacing: 0.3px;
        }
        .notif-mark-all-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(88,166,255,0.08);
          border: 1px solid rgba(88,166,255,0.2);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .notif-mark-all-btn:hover {
          background: rgba(88,166,255,0.15);
          border-color: rgba(88,166,255,0.4);
          transform: translateY(-1px);
        }

        /* Notification List */
        .notif-list {
          max-height: calc(100vh - var(--nav-height) - 140px);
          overflow-y: auto;
        }

        /* Notification Item */
        .notif-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .notif-item:last-child {
          border-bottom: none;
        }
        .notif-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .notif-item.unread {
          background: rgba(88,166,255,0.03);
        }
        .notif-item.unread:hover {
          background: rgba(88,166,255,0.06);
        }

        /* Unread dot */
        .notif-unread-dot {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: translateY(-50%) scale(1); }
          50% { opacity: 0.6; transform: translateY(-50%) scale(1.3); }
        }

        /* Type icon */
        .notif-type-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Avatar */
        .notif-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          background: #38434F;
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .notif-avatar:hover {
          border-color: var(--primary);
        }
        .notif-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .notif-avatar-placeholder {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary);
        }

        /* Content */
        .notif-content {
          flex: 1;
          min-width: 0;
        }
        .notif-message {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .notif-item.unread .notif-message {
          font-weight: 600;
        }
        .notif-time {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
          display: block;
        }

        /* Action (follow button) */
        .notif-action {
          flex-shrink: 0;
        }

        /* Empty state */
        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          color: var(--text-muted);
          text-align: center;
        }
        .notif-empty p {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-secondary);
          margin: 16px 0 4px;
        }
        .notif-empty span {
          font-size: 14px;
          max-width: 300px;
        }

        /* Loading */
        .notif-loading {
          display: flex;
          justify-content: center;
          padding: 32px 0;
        }

        /* Load more */
        .notif-load-more {
          display: block;
          width: 100%;
          padding: 14px;
          background: transparent;
          border: none;
          border-top: 1px solid var(--border);
          color: var(--primary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .notif-load-more:hover {
          background: rgba(88,166,255,0.05);
        }

        @media (max-width: 768px) {
          .notifications-page {
            padding: 12px 8px;
          }
          .notif-header {
            padding: 16px;
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          .notif-item {
            padding: 12px 16px;
          }
          .notif-type-icon {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
