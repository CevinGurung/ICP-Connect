import React, { useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, removeToast }) {
  const onRemove = useCallback(() => removeToast(toast.id), [removeToast, toast.id]);

  useEffect(() => {
    const timer = setTimeout(onRemove, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div className={`toast-item toast-${toast.type} pop-alert`}>
      <div className="toast-icon">
        {toast.type === "error" ? (
          <AlertCircle size={20} color="var(--error)" />
        ) : (
          <CheckCircle size={20} color="var(--success)" />
        )}
      </div>
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
      </div>
      <button className="toast-close" onClick={onRemove}>
        <X size={16} />
      </button>
    </div>
  );
}
