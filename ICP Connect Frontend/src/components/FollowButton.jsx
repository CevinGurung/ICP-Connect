import React, { useState } from 'react';

/**
 * Unified Follow Button with 4 states:
 * 1. Neither follows: "Follow" → hover: "Follow"
 * 2. I follow them, they don't follow me: "Following" → hover: "Unfollow"
 * 3. They follow me, I don't follow them: "Follow Back" → hover: "Follow Back"
 * 4. Both follow each other (mutual): "Connection" → hover: "Unfollow"
 */
const FollowButton = ({ isFollowing, isFollowedBy, onToggle, size = 'sm' }) => {
  const [hovered, setHovered] = useState(false);

  let label, hoverLabel, className;

  if (isFollowing && isFollowedBy) {
    // Mutual connection
    label = 'Connection';
    hoverLabel = 'Unfollow';
    className = 'follow-btn connection';
  } else if (isFollowing && !isFollowedBy) {
    // I follow them
    label = 'Following';
    hoverLabel = 'Unfollow';
    className = 'follow-btn following';
  } else if (!isFollowing && isFollowedBy) {
    // They follow me
    label = 'Follow Back';
    hoverLabel = 'Follow Back';
    className = 'follow-btn follow-back';
  } else {
    // Neither follows
    label = 'Follow';
    hoverLabel = 'Follow';
    className = 'follow-btn not-following';
  }

  const isUnfollow = hovered && (isFollowing && !isFollowedBy || isFollowing && isFollowedBy);

  return (
    <>
      <button
        className={`btn btn-${size} ${className} ${isUnfollow ? 'danger-hover' : ''}`}
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {hovered ? hoverLabel : label}
      </button>

      <style>{`
        .follow-btn {
          min-width: 100px;
          font-weight: 600;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .follow-btn.not-following {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .follow-btn.not-following:hover {
          background: #4a94e8;
          transform: scale(1.02);
        }
        .follow-btn.following {
          background: transparent;
          color: var(--primary);
          border-color: var(--primary);
        }
        .follow-btn.connection {
          background: rgba(46, 160, 67, 0.1);
          color: #2ea043;
          border-color: rgba(46, 160, 67, 0.4);
        }
        .follow-btn.follow-back {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border-color: transparent;
        }
        .follow-btn.follow-back:hover {
          transform: scale(1.02);
          box-shadow: 0 0 12px rgba(124, 58, 237, 0.3);
        }
        .follow-btn.danger-hover:hover {
          background: rgba(248, 81, 73, 0.1) !important;
          color: #f85149 !important;
          border-color: rgba(248, 81, 73, 0.4) !important;
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </>
  );
};

export default FollowButton;
