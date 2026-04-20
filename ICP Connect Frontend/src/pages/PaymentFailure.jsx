import React from "react";
import { XCircle, RefreshCcw, Home, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="payment-result-page container">
      <div className="result-card glass fade-in">
        <div className="status-icon failure-animation">
          <XCircle size={80} color="var(--error)" />
        </div>
        
        <h1>Payment Failed</h1>
        <p className="subtitle">Something went wrong during the transaction. Don't worry, your money is safe.</p>

        <div className="failure-info">
          <p>Common reasons for failure:</p>
          <ul>
            <li>Insufficient balance in eSewa account</li>
            <li>Transaction timed out</li>
            <li>Authentication failure</li>
            <li>Cancelled by user</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            <RefreshCcw size={18} /> Try Again
          </button>
          <Link to="/" className="btn btn-ghost">
            <Home size={18} /> Back to Home
          </Link>
        </div>

        <div className="support-link">
          <p>Having persistent issues? <Link to="/messages">Contact Support</Link></p>
        </div>
      </div>

      <style>{`
        .payment-result-page {
          height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .result-card {
          max-width: 500px;
          width: 100%;
          padding: 48px;
          text-align: center;
          border-radius: 20px;
          border: 1px solid var(--border);
        }
        .status-icon { margin-bottom: 24px; display: flex; justify-content: center; }
        .result-card h1 { font-size: 32px; font-weight: 800; margin-bottom: 12px; }
        .subtitle { color: var(--text-secondary); margin-bottom: 32px; }
        
        .failure-info {
          background: rgba(255, 69, 58, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 32px;
          text-align: left;
        }
        .failure-info p { font-weight: 700; margin-bottom: 12px; color: var(--error); font-size: 14px; }
        .failure-info ul { margin: 0; padding-left: 20px; color: var(--text-secondary); font-size: 13px; }
        .failure-info li { margin-bottom: 6px; }

        .action-buttons { display: flex; gap: 16px; justify-content: center; }
        .support-link { margin-top: 32px; font-size: 14px; color: var(--text-muted); }
        .support-link a { color: var(--primary); font-weight: 600; text-decoration: none; }

        .failure-animation {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
}
