import React, { useState } from "react";
import { X, Flag, AlertTriangle, Shield, MessageSquare, HelpCircle } from "lucide-react";

export default function ReportModal({ isOpen, onClose, onReport }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = [
    { id: "spam", label: "Spam", icon: <AlertTriangle size={18} />, desc: "Malicious links, fake accounts, or repetitive content." },
    { id: "harassment", label: "Harassment", icon: <Shield size={18} />, desc: "Bullying, threats, or targeted hate speech." },
    { id: "inappropriate", label: "Inappropriate Content", icon: <Flag size={18} />, desc: "Nudity, violence, or offensive imagery." },
    { id: "misinformation", label: "Misinformation", icon: <HelpCircle size={18} />, desc: "False news or misleading information about ICP." },
    { id: "other", label: "Other", icon: <MessageSquare size={18} />, desc: "Something else that doesn't fit these categories." },
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    
    setLoading(true);
    const fullReason = reason === "other" ? `Other: ${details}` : `${reasons.find(r => r.id === reason).label}${details ? ` - ${details}` : ""}`;
    
    try {
      await onReport(fullReason);
      setReason("");
      setDetails("");
      // onClose is called by parent usually, but we call it here to close modal on success
      onClose();
    } catch (err) {
      // Error handled by parent toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <div className="icon-circle">
              <Flag size={20} className="text-error" />
            </div>
            <div>
              <h3>Report Post</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>Help us keep the ICP Connect community safe.</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="reason-grid">
            {reasons.map((r) => (
              <label key={r.id} className={`reason-pill ${reason === r.id ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="reason" 
                  value={r.id} 
                  checked={reason === r.id} 
                  onChange={(e) => setReason(e.target.value)}
                  className="hidden-radio"
                />
                <div className="pill-content">
                  <div className="pill-icon">{r.icon}</div>
                  <div className="pill-text">
                    <span className="pill-label">{r.label}</span>
                    <span className="pill-desc">{r.desc}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="details-section">
            <label className="field-label">Additional Details (Optional)</label>
            <textarea 
              placeholder="Provide more context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="details-textarea"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="btn btn-primary btn-report" 
              disabled={!reason || loading}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .report-modal { max-width: 550px; overflow: visible; padding: 24px; }
        .modal-header { padding: 0 0 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .header-title { display: flex; gap: 16px; align-items: center; }
        .icon-circle { width: 40px; height: 40px; border-radius: 50%; background: rgba(248, 81, 73, 0.1); display: flex; align-items: center; justify-content: center; }
        .text-error { color: #f85149; }
        .modal-body { padding: 20px 0 0; display: flex; flex-direction: column; gap: 24px; }
        
        .reason-grid { display: flex; flex-direction: column; gap: 10px; }
        .reason-pill { 
          display: block; cursor: pointer; border: 1px solid var(--border); 
          border-radius: 12px; transition: all 0.2s; background: #0D1117;
          position: relative;
        }
        .reason-pill:hover { border-color: var(--primary); background: #161B22; }
        .reason-pill.active { border-color: var(--primary); background: rgba(88, 166, 255, 0.05); box-shadow: 0 0 0 1px var(--primary); }
        
        .hidden-radio { position: absolute; opacity: 0; }
        .pill-content { display: flex; gap: 16px; padding: 12px 16px; align-items: center; }
        .pill-icon { color: var(--text-secondary); transition: all 0.2s; }
        .reason-pill.active .pill-icon { color: var(--primary); }
        .pill-text { display: flex; flex-direction: column; }
        .pill-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .pill-desc { font-size: 12px; color: var(--text-muted); }
        
        .details-section { display: flex; flex-direction: column; gap: 8px; }
        .field-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .details-textarea {
          width: 100%; min-height: 80px; background: #0D1117; border: 1px solid var(--border);
          border-radius: 8px; padding: 12px; color: var(--text-primary); resize: vertical;
          outline: none; font-size: 14px; transition: border-color 0.2s;
        }
        .details-textarea:focus { border-color: var(--primary); }
        
        .modal-footer { padding: 0; display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
        .btn-report { background: #f85149 !important; border-color: #f85149 !important; color: white !important; }
        .btn-report:hover:not(:disabled) { opacity: 0.9; }
        .btn-report:disabled { opacity: 0.5; background: #30363D !important; border-color: #30363D !important; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
