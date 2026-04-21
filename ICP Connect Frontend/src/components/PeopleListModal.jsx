import React from 'react';
import { X } from 'lucide-react';
import FollowButton from './FollowButton';

const PeopleListModal = ({ isOpen, onClose, title, data, loading, onToggleFollow, API_BASE, navigate }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content people-list-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body scrollable-list">
          {loading ? (
            <div className="list-loading"><div className="spinner"></div></div>
          ) : data.length > 0 ? (
            data.map(user => (
              <div key={user.id} className="person-row">
                <div className="person-info" onClick={() => {
                  onClose();
                  navigate(`/profile/${user.id}`);
                }}>
                  <div className="person-pfp">
                    {user.profileImageUrl ? (
                      <img src={`${API_BASE}${user.profileImageUrl}`} alt={user.fullName} className="avatar-img" />
                    ) : (
                      <div className="pfp-placeholder-sm">{user.fullName[0]}</div>
                    )}
                  </div>
                  <div className="person-meta">
                    <span className="person-name">{user.fullName}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="person-username">@{user.userName}</span>
                      {user.role === 'TEACHER' && (
                        <span style={{ 
                          fontSize: '10px', 
                          background: 'rgba(63, 185, 80, 0.1)', 
                          color: 'var(--success)', 
                          padding: '1px 6px', 
                          borderRadius: '4px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>Faculty</span>
                      )}
                    </div>
                  </div>
                </div>
                {!user.isOwnProfile && (
                  <FollowButton
                    isFollowing={user.isFollowing}
                    isFollowedBy={user.isFollowedBy}
                    onToggle={() => onToggleFollow(user)}
                  />
                )}
              </div>
            ))
          ) : (
            <div className="empty-list">No {title.toLowerCase()} yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeopleListModal;
