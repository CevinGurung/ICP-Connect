import React from "react";
import { AlertCircle, Shield, X, Info } from "lucide-react";

export default function AdminConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm",
  type = "danger",
  loading = false,
  icon: CustomIcon
}) {
  if (!isOpen) return null;

  const isDanger = type === "danger";
  const Icon = CustomIcon || (isDanger ? AlertCircle : Shield);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose} disabled={loading}>
          <X size={18} />
        </button>

        <div className="admin-modal-body text-center">
          <div className={`admin-modal-icon-wrap ${isDanger ? 'icon-danger' : 'icon-primary'}`}>
            <Icon size={32} />
          </div>
          
          <h2 className="admin-modal-title">{title}</h2>
          <p className="admin-modal-message">{message}</p>

          <div className="admin-modal-footer">
            <button 
              className="btn-admin btn-admin-ghost" 
              onClick={onClose}
              disabled={loading}
              style={{ padding: '8px 24px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button 
              className={`btn-admin ${isDanger ? 'btn-admin-danger-solid' : 'btn-admin-primary'}`}
              onClick={onConfirm}
              disabled={loading}
              style={{ padding: '8px 24px', fontSize: '13px', minWidth: '100px' }}
            >
              {loading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .admin-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
          animation: modal-fade-in 0.2s ease-out;
        }

        .admin-modal-content {
          background: #161B22;
          border: 1px solid #30363D;
          border-radius: 12px;
          width: 90%; max-width: 400px;
          padding: 32px 24px;
          position: relative;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
          animation: modal-pop-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .admin-modal-close {
          position: absolute; top: 12px; right: 12px;
          background: transparent; border: none; color: #8B949E;
          cursor: pointer; padding: 4px; border-radius: 6px;
          transition: all 0.15s;
        }
        .admin-modal-close:hover { background: #30363D; color: #E6EDF3; }

        .admin-modal-icon-wrap {
          width: 64px; height: 64px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
        }
        .icon-danger { background: rgba(248, 81, 73, 0.1); color: #F85149; }
        .icon-primary { background: rgba(88, 166, 255, 0.1); color: #58A6FF; }

        .admin-modal-title {
          font-size: 20px; font-weight: 700; color: #E6EDF3;
          margin: 0 0 12px;
        }
        .admin-modal-message {
          font-size: 14px; color: #8B949E; line-height: 1.5;
          margin: 0 0 24px;
        }

        .admin-modal-footer {
          display: flex; gap: 12px; justify-content: center;
        }

        .btn-admin-danger-solid {
          background: #DA3633; color: #FFFFFF; border: 1px solid rgba(240, 73, 73, 0.4);
        }
        .btn-admin-danger-solid:hover { background: #B62324; }

        .text-center { text-align: center; }

        @keyframes modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-pop-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
